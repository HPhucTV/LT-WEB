namespace TravelTour.Api.Contracts;

public record ReviewRequest(string CustomerName, int Rating, string Comment);

public record ReviewResponse(int Id, int TourId, string CustomerName, int Rating, string Comment, DateTime CreatedAt);

public record TourRatingResponse(int TourId, double AverageRating, int ReviewCount);
