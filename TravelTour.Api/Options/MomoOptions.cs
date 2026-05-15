namespace TravelTour.Api.Options;

public class MomoOptions
{
    public string PartnerCode { get; set; } = string.Empty;

    public string AccessKey { get; set; } = string.Empty;

    public string SecretKey { get; set; } = string.Empty;

    public string Endpoint { get; set; } = "https://test-payment.momo.vn/v2/gateway/api/create";

    public string RedirectUrl { get; set; } = "http://localhost:5173/payment-result";

    public string IpnUrl { get; set; } = "http://localhost:5141/api/payments/momo/ipn";
}
