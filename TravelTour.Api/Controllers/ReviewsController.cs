using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TravelTour.Api.Contracts;
using TravelTour.Api.Services;

namespace TravelTour.Api.Controllers;

[ApiController]
[Route("api/tours/{tourId:int}/reviews")]
public class ReviewsController(ReviewService reviewService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetReviews(int tourId)
    {
        var result = await reviewService.GetReviewsAsync(tourId);
        return result.IsNotFound ? NotFound(new { message = "Tour không tồn tại." }) : Ok(result.Value);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CreateReview(int tourId, ReviewRequest request)
    {
        var result = await reviewService.CreateReviewAsync(tourId, request);
        if (result.IsNotFound) return NotFound(new { message = "Tour không tồn tại." });
        return result.IsSuccess
            ? Created($"/api/tours/{tourId}/reviews/{result.Value!.Id}", result.Value)
            : BadRequest(new { message = result.Error });
    }
}

[Authorize]
[ApiController]
[Route("api/reviews")]
public class CustomerReviewsController(ReviewService reviewService) : ControllerBase
{
    [HttpGet("me")]
    public async Task<IActionResult> GetMine()
    {
        var result = await reviewService.GetMineAsync(CurrentUsername());
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(new { message = result.Error });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateMine(int id, ReviewUpdateRequest request)
    {
        var result = await reviewService.UpdateMineAsync(
            CurrentUsername(),
            id,
            new ReviewRequest(CurrentFullName() ?? "", request.Rating, request.Comment));
        if (result.IsNotFound) return NotFound();
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteMine(int id)
    {
        var result = await reviewService.DeleteMineAsync(CurrentUsername(), id);
        if (result.IsNotFound) return NotFound();
        return result.IsSuccess ? NoContent() : Unauthorized(new { message = result.Error });
    }

    private string? CurrentUsername()
    {
        return User.FindFirstValue(ClaimTypes.Name);
    }

    private string? CurrentFullName()
    {
        return User.FindFirstValue("fullName");
    }
}

[ApiController]
[Route("api/tours/ratings")]
public class TourRatingsController(ReviewService reviewService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllRatings()
    {
        return Ok(await reviewService.GetAllRatingsAsync());
    }
}

public record ReviewUpdateRequest(int Rating, string Comment);
