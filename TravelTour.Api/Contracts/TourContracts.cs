namespace TravelTour.Api.Contracts;

public record TourRequest(
    string Code,
    string Name,
    string Destination,
    int DurationDays,
    decimal Price,
    decimal OriginalPrice,
    string PromotionTitle,
    string PromotionDescription,
    DateOnly? DiscountStartDate,
    DateOnly? DiscountEndDate,
    int MaxGuests,
    string Category,
    string Description,
    string ImageUrl,
    bool IsActive);

public record TourResponse(
    int Id,
    string Code,
    string Name,
    string Destination,
    int DurationDays,
    decimal Price,
    decimal OriginalPrice,
    string PromotionTitle,
    string PromotionDescription,
    DateOnly? DiscountStartDate,
    DateOnly? DiscountEndDate,
    int MaxGuests,
    string Category,
    string Description,
    string ImageUrl,
    bool IsActive);
