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

    public string? RequestNote { get; init; }

    public int AdultCount { get; init; }

    public int ChildCount { get; init; }

    public List<BookingPassengerRequest> Passengers { get; init; } = [];

    public string? VoucherCode { get; init; }
}

public record BookingStatusUpdate(string Status);

public record BookingPassengerRequest(
    string FullName,
    DateOnly DateOfBirth,
    string PassengerType,
    string? IdentityNumber,
    string Phone);

public record ContractConfirmationRequest(
    int SalesUserId,
    int GuideUserId,
    decimal ContractAmount,
    string? PaymentTerms,
    string? CancellationTerms);

public record CustomerContractSignatureRequest(string? SignedByName);

public record BookingPassengerResponse(
    int Id,
    string FullName,
    DateOnly DateOfBirth,
    string PassengerType,
    string? IdentityNumber,
    string Phone);

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
    string? RequestNote,
    string? PaymentTerms,
    string? CancellationTerms,
    int? SalesUserId,
    string? SalesName,
    string ContractStatus,
    decimal ContractAmount,
    decimal EstimatedAmount,
    int AdultCount,
    int ChildCount,
    decimal DepositAmount,
    decimal RemainingAmount,
    DateOnly? RemainingDueDate,
    string DepositPaymentStatus,
    string RemainingPaymentStatus,
    DateTime? DepositPaidAt,
    DateTime? RemainingPaidAt,
    string? SalesSignedByName,
    DateTime? SalesSignedAt,
    string? CustomerSignedByName,
    DateTime? CustomerSignedAt,
    string CustomerSignatureStatus,
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
    DateTime CreatedAt,
    List<BookingPassengerResponse> Passengers);
