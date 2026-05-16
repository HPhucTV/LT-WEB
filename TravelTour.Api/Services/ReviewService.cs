using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Contracts;
using TravelTour.Api.Data;
using TravelTour.Api.Models;

namespace TravelTour.Api.Services;

public class ReviewService(AppDbContext db)
{
    public async Task<ServiceResult<List<ReviewResponse>>> GetReviewsAsync(int tourId)
    {
        if (!await db.Tours.AnyAsync(t => t.Id == tourId))
        {
            return ServiceResult<List<ReviewResponse>>.NotFound();
        }

        var reviews = await db.Reviews
            .AsNoTracking()
            .Where(r => r.TourId == tourId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewResponse(r.Id, r.TourId, r.CustomerName, r.Rating, r.Comment, r.CreatedAt))
            .ToListAsync();

        return ServiceResult<List<ReviewResponse>>.Success(reviews);
    }

    public async Task<ServiceResult<ReviewResponse>> CreateReviewAsync(int tourId, ReviewRequest request)
    {
        if (!await db.Tours.AnyAsync(t => t.Id == tourId))
        {
            return ServiceResult<ReviewResponse>.NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.CustomerName))
        {
            return ServiceResult<ReviewResponse>.BadRequest("Tên khách hàng không được để trống.");
        }

        if (request.Rating < 1 || request.Rating > 5)
        {
            return ServiceResult<ReviewResponse>.BadRequest("Đánh giá phải từ 1 đến 5 sao.");
        }

        var review = new Review
        {
            TourId = tourId,
            CustomerName = request.CustomerName.Trim(),
            Rating = request.Rating,
            Comment = request.Comment?.Trim() ?? string.Empty
        };

        db.Reviews.Add(review);
        await db.SaveChangesAsync();

        return ServiceResult<ReviewResponse>.Success(ToResponse(review));
    }

    public async Task<List<TourRatingResponse>> GetAllRatingsAsync()
    {
        return await db.Reviews
            .AsNoTracking()
            .GroupBy(r => r.TourId)
            .Select(g => new TourRatingResponse(g.Key, Math.Round(g.Average(r => r.Rating), 1), g.Count()))
            .ToListAsync();
    }

    private static ReviewResponse ToResponse(Review review)
    {
        return new ReviewResponse(review.Id, review.TourId, review.CustomerName, review.Rating, review.Comment, review.CreatedAt);
    }
}
