using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Contracts;
using TravelTour.Api.Data;
using TravelTour.Api.Models;

namespace TravelTour.Api.Services;

public class ReviewService(AppDbContext db)
{
    public async Task<ServiceResult<List<MyReviewResponse>>> GetMineAsync(string? username)
    {
        var user = await GetUserAsync(username);
        if (user is null) return ServiceResult<List<MyReviewResponse>>.BadRequest("Unauthorized");

        var reviews = await db.Reviews
            .AsNoTracking()
            .Include(r => r.Tour)
            .Where(r => r.CustomerName == user.FullName)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new MyReviewResponse(
                r.Id, r.TourId, r.Tour!.Name, r.CustomerName, r.Rating, r.Comment, r.CreatedAt))
            .ToListAsync();

        return ServiceResult<List<MyReviewResponse>>.Success(reviews);
    }

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

    public async Task<ServiceResult<MyReviewResponse>> UpdateMineAsync(string? username, int id, ReviewRequest request)
    {
        var user = await GetUserAsync(username);
        if (user is null) return ServiceResult<MyReviewResponse>.BadRequest("Unauthorized");

        var review = await db.Reviews
            .Include(r => r.Tour)
            .FirstOrDefaultAsync(r => r.Id == id && r.CustomerName == user.FullName);
        if (review is null) return ServiceResult<MyReviewResponse>.NotFound();

        if (request.Rating < 1 || request.Rating > 5)
        {
            return ServiceResult<MyReviewResponse>.BadRequest("Đánh giá phải từ 1 đến 5 sao.");
        }

        review.Rating = request.Rating;
        review.Comment = request.Comment?.Trim() ?? string.Empty;

        await db.SaveChangesAsync();
        return ServiceResult<MyReviewResponse>.Success(ToMyResponse(review));
    }

    public async Task<ServiceResult> DeleteMineAsync(string? username, int id)
    {
        var user = await GetUserAsync(username);
        if (user is null) return ServiceResult.BadRequest("Unauthorized");

        var review = await db.Reviews.FirstOrDefaultAsync(r => r.Id == id && r.CustomerName == user.FullName);
        if (review is null) return ServiceResult.NotFound();

        db.Reviews.Remove(review);
        await db.SaveChangesAsync();
        return ServiceResult.Success();
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

    private static MyReviewResponse ToMyResponse(Review review)
    {
        return new MyReviewResponse(
            review.Id, review.TourId, review.Tour?.Name ?? "", review.CustomerName, review.Rating, review.Comment, review.CreatedAt);
    }

    private async Task<User?> GetUserAsync(string? username)
    {
        return string.IsNullOrWhiteSpace(username)
            ? null
            : await db.Users.AsNoTracking().FirstOrDefaultAsync(user => user.Username == username);
    }
}
