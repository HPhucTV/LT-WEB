namespace TravelTour.Api.Contracts;

public record CreateVnpayPaymentResponse(
    int BookingId,
    string Stage,
    string TransactionRef,
    string PaymentUrl,
    string Message);
