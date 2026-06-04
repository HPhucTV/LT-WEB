namespace TravelTour.Api.Contracts;

public class BookingRequest
{
    public int? TourScheduleId { get; init; }

    public int? TourId { get; init; }

    public DateOnly? RequestedStartDate { get; init; }

    public string CustomerName { get; init; } = string.Empty;

    public string CustomerPhone { get; init; } = string.Empty;

    public string CustomerEmail { get; init; } = string.Empty;

    public int GuestCount { get; init; }

    public string BookingType { get; init; } = "Shared";

    public string? VoucherCode { get; init; }
}

public record BookingStatusUpdate(string Status);

public record BookingResponse(
    int Id,
    int TourScheduleId,
    string TourName,
    DateOnly StartDate,
    DateOnly EndDate,
    string CustomerName,
    string CustomerPhone,
    string CustomerEmail,
    int GuestCount,
    string BookingType,
    string? VoucherCode,
    decimal VoucherDiscountAmount,
    string ScheduleType,
    string ScheduleStatus,
    int? GuideUserId,
    string? GuideName,
    decimal TotalAmount,
    string Status,
    string PaymentMethod,
    string PaymentStatus,
    string? TransactionId,
    DateTime? PaidAt,
    DateTime CreatedAt);
