namespace TravelTour.Api.Contracts;

public record BookingRequest(
    int TourScheduleId,
    string CustomerName,
    string CustomerPhone,
    string CustomerEmail,
    int GuestCount,
    string BookingType = "Shared");

public record BookingStatusUpdate(string Status);

public record BookingResponse(
    int Id,
    int TourScheduleId,
    string TourName,
    DateOnly StartDate,
    string CustomerName,
    string CustomerPhone,
    string CustomerEmail,
    int GuestCount,
    string BookingType,
    decimal TotalAmount,
    string Status,
    string PaymentMethod,
    string PaymentStatus,
    string? TransactionId,
    DateTime? PaidAt,
    DateTime CreatedAt);
