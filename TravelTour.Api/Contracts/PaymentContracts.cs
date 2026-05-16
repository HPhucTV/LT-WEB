namespace TravelTour.Api.Contracts;

public record CreateVnpayPaymentResponse(
    int BookingId,
    string TransactionRef,
    string PaymentUrl,
    string Message);
