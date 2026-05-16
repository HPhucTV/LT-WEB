namespace TravelTour.Api.Options;

public class VnpayOptions
{
    public string TmnCode { get; set; } = string.Empty;

    public string HashSecret { get; set; } = string.Empty;

    public string PaymentUrl { get; set; } = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    public string ReturnUrl { get; set; } = "http://localhost:5141/api/payments/vnpay/return";

    public string ClientReturnUrl { get; set; } = "http://localhost:5173/payment-result";
}
