using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Contracts;
using TravelTour.Api.Data;
using TravelTour.Api.Models;

namespace TravelTour.Api.Controllers;

[ApiController]
[Route("api/tours/{tourId:int}/reviews")]
public class ReviewsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetReviews(int tourId)
    {
        var exists = await db.Tours.AnyAsync(t => t.Id == tourId);
        if (!exists)
            return NotFound(new { message = "Tour không tồn tại." });

        var reviews = await db.Reviews
            .AsNoTracking()
            .Where(r => r.TourId == tourId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewResponse(r.Id, r.TourId, r.CustomerName, r.Rating, r.Comment, r.CreatedAt))
            .ToListAsync();

        return Ok(reviews);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CreateReview(int tourId, ReviewRequest request)
    {
        var tour = await db.Tours.FirstOrDefaultAsync(t => t.Id == tourId);
        if (tour is null)
            return NotFound(new { message = "Tour không tồn tại." });

        if (string.IsNullOrWhiteSpace(request.CustomerName))
            return BadRequest(new { message = "Tên khách hàng không được để trống." });

        if (request.Rating < 1 || request.Rating > 5)
            return BadRequest(new { message = "Đánh giá phải từ 1 đến 5 sao." });

        var review = new Review
        {
            TourId = tourId,
            CustomerName = request.CustomerName.Trim(),
            Rating = request.Rating,
            Comment = request.Comment?.Trim() ?? string.Empty
        };

        db.Reviews.Add(review);
        await db.SaveChangesAsync();

        return Created($"/api/tours/{tourId}/reviews/{review.Id}",
            new ReviewResponse(review.Id, review.TourId, review.CustomerName, review.Rating, review.Comment, review.CreatedAt));
    }
}

/// <summary>
/// Separate controller for aggregated tour ratings (avoids N+1 from frontend).
/// </summary>
[ApiController]
[Route("api/tours/ratings")]
public class TourRatingsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllRatings()
    {
        var ratings = await db.Reviews
            .AsNoTracking()
            .GroupBy(r => r.TourId)
            .Select(g => new TourRatingResponse(
                g.Key,
                Math.Round(g.Average(r => r.Rating), 1),
                g.Count()))
            .ToListAsync();

        return Ok(ratings);
    }
}
