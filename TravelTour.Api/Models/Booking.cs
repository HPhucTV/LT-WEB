namespace TravelTour.Api.Models;

public class Booking
{
    public int Id { get; set; }

    public int TourScheduleId { get; set; }

    public TourSchedule? TourSchedule { get; set; }

    public int? CustomerId { get; set; }

    public Customer? Customer { get; set; }

    public string CustomerName { get; set; } = string.Empty;

    public string CustomerPhone { get; set; } = string.Empty;

    public string CustomerEmail { get; set; } = string.Empty;

    public int GuestCount { get; set; }

    public string BookingType { get; set; } = "Shared";

    public string? VoucherCode { get; set; }

    public decimal VoucherDiscountAmount { get; set; }

    public decimal TotalAmount { get; set; }

    public string Status { get; set; } = "Pending";

    public string PaymentMethod { get; set; } = "Cash";

    public string PaymentStatus { get; set; } = "Unpaid";

    public string? MomoOrderId { get; set; }

    public string? MomoRequestId { get; set; }

    public string? MomoTransactionId { get; set; }

    public DateTime? PaidAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
