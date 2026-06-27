namespace TravelTour.Api.Models;

public class PrivateGroupContract
{
    public int BookingId { get; set; }

    public Booking? Booking { get; set; }

    public int? SalesUserId { get; set; }

    public User? SalesUser { get; set; }

    public string? SalesName { get; set; }

    public string ContractStatus { get; set; } = "None";

    public decimal ContractAmount { get; set; }

    public string? PaymentTerms { get; set; }

    public string? CancellationTerms { get; set; }

    public decimal DepositAmount { get; set; }

    public decimal RemainingAmount { get; set; }

    public DateOnly? RemainingDueDate { get; set; }

    public string DepositPaymentStatus { get; set; } = "Unpaid";

    public string RemainingPaymentStatus { get; set; } = "Unpaid";

    public DateTime? DepositPaidAt { get; set; }

    public DateTime? RemainingPaidAt { get; set; }

    public string? DepositTransactionRef { get; set; }

    public string? RemainingTransactionRef { get; set; }

    public int? SalesSignedByUserId { get; set; }

    public string? SalesSignedByName { get; set; }

    public DateTime? SalesSignedAt { get; set; }

    public string? CustomerSignedByName { get; set; }

    public DateTime? CustomerSignedAt { get; set; }

    public string CustomerSignatureStatus { get; set; } = "Pending";
}
