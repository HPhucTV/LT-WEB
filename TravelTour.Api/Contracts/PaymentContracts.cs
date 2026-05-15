namespace TravelTour.Api.Contracts;

public record CreateMomoPaymentResponse(
    int BookingId,
    string OrderId,
    string RequestId,
    string? PayUrl,
    string? Deeplink,
    string? QrCodeUrl,
    string Message);

public record MomoIpnRequest(
    string? PartnerCode,
    string? OrderId,
    string? RequestId,
    long Amount,
    string? OrderInfo,
    string? OrderType,
    long? TransId,
    int ResultCode,
    string? Message,
    string? PayType,
    long ResponseTime,
    string? ExtraData,
    string? Signature);
