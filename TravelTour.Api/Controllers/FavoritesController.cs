using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Contracts;
using TravelTour.Api.Data;
using TravelTour.Api.Models;

namespace TravelTour.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/favorites")]
public class FavoritesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        var favorites = await db.TourFavorites
            .AsNoTracking()
            .Include(item => item.Tour)
            .Where(item => item.UserId == user.Id)
            .OrderByDescending(item => item.CreatedAt)
            .Select(item => ToResponse(item.Tour))
            .ToListAsync(cancellationToken);

        return Ok(favorites);
    }

    [HttpPost]
    public async Task<IActionResult> Add(FavoriteRequest request, CancellationToken cancellationToken)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        if (!await db.Tours.AnyAsync(tour => tour.Id == request.TourId, cancellationToken))
        {
            return NotFound(new { message = "Tour không tồn tại." });
        }

        var exists = await db.TourFavorites
            .AnyAsync(item => item.UserId == user.Id && item.TourId == request.TourId, cancellationToken);
        if (exists) return Ok(new { success = true });

        db.TourFavorites.Add(new TourFavorite { UserId = user.Id, TourId = request.TourId });
        await db.SaveChangesAsync(cancellationToken);

        return Created("/api/favorites", new { success = true });
    }

    [HttpDelete("{tourId:int}")]
    public async Task<IActionResult> Remove(int tourId, CancellationToken cancellationToken)
    {
        var user = await GetCurrentUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        var favorite = await db.TourFavorites
            .FirstOrDefaultAsync(item => item.UserId == user.Id && item.TourId == tourId, cancellationToken);
        if (favorite is null) return NoContent();

        db.TourFavorites.Remove(favorite);
        await db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private async Task<User?> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrWhiteSpace(username)) return null;
        return await db.Users.FirstOrDefaultAsync(user => user.Username == username, cancellationToken);
    }

    private static TourResponse ToResponse(Tour tour)
    {
        return new TourResponse(tour.Id, tour.Code, tour.Name, tour.Destination,
            tour.DurationDays, tour.Price, tour.OriginalPrice,
            tour.PromotionTitle, tour.PromotionDescription,
            tour.DiscountStartDate, tour.DiscountEndDate, tour.MaxGuests,
            tour.Category, tour.Description, tour.ImageUrl, tour.IsActive);
    }
}

public record FavoriteRequest(int TourId);
