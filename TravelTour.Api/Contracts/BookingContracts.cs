namespace TravelTour.Api.Contracts;

public record BookingRequest(
    int TourScheduleId,
    string CustomerName,
    string CustomerPhone,
    int GuestCount);

public record BookingStatusUpdate(string Status);

public record BookingResponse(
    int Id,
    int TourScheduleId,
    string TourName,
    DateOnly StartDate,
    string CustomerName,
    string CustomerPhone,
    int GuestCount,
    decimal TotalAmount,
    string Status,
    string PaymentMethod,
    string PaymentStatus,
    DateTime CreatedAt);
