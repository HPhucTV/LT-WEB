using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
