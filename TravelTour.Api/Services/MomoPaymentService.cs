using System.Globalization;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TravelTour.Api.Models;
using TravelTour.Api.Options;

namespace TravelTour.Api.Services;

public class MomoPaymentService(HttpClient httpClient, IOptions<MomoOptions> options)
{
    private readonly MomoOptions _options = options.Value;

    public async Task<MomoCreatePaymentResult> CreatePaymentAsync(Booking booking, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.PartnerCode) ||
            string.IsNullOrWhiteSpace(_options.AccessKey) ||
            string.IsNullOrWhiteSpace(_options.SecretKey))
        {
            throw new InvalidOperationException("Chua cau hinh day du thong tin MoMo.");
        }

        var amount = decimal.ToInt64(decimal.Round(booking.TotalAmount, 0, MidpointRounding.AwayFromZero));
        var requestId = $"{_options.PartnerCode}{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        var orderId = $"BOOKING-{booking.Id}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
        var requestType = "captureWallet";
        var extraData = Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new
        {
            bookingId = booking.Id
        })));
        var orderInfo = $"Thanh toan booking #{booking.Id}";

        var rawSignature =
            $"accessKey={_options.AccessKey}" +
            $"&amount={amount}" +
            $"&extraData={extraData}" +
            $"&ipnUrl={_options.IpnUrl}" +
            $"&orderId={orderId}" +
            $"&orderInfo={orderInfo}" +
            $"&partnerCode={_options.PartnerCode}" +
            $"&redirectUrl={_options.RedirectUrl}" +
            $"&requestId={requestId}" +
            $"&requestType={requestType}";

        var payload = new
        {
            partnerCode = _options.PartnerCode,
            accessKey = _options.AccessKey,
            requestId,
            amount = amount.ToString(CultureInfo.InvariantCulture),
            orderId,
            orderInfo,
            redirectUrl = _options.RedirectUrl,
            ipnUrl = _options.IpnUrl,
            extraData,
            requestType,
            signature = CreateSignature(rawSignature),
            lang = "vi"
        };

        using var response = await httpClient.PostAsJsonAsync(_options.Endpoint, payload, cancellationToken);
        var body = await response.Content.ReadFromJsonAsync<MomoCreatePaymentGatewayResponse>(
            cancellationToken: cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(body?.Message ?? "Khong tao duoc giao dich MoMo.");
        }

        return new MomoCreatePaymentResult(
            orderId,
            requestId,
            body?.PayUrl,
            body?.Deeplink,
            body?.QrCodeUrl,
            body?.Message ?? "Da tao yeu cau thanh toan MoMo.");
    }

    public bool VerifyIpnSignature(MomoIpnPayload payload)
    {
        var rawSignature =
            $"accessKey={_options.AccessKey}" +
            $"&amount={payload.Amount}" +
            $"&extraData={payload.ExtraData}" +
            $"&message={payload.Message}" +
            $"&orderId={payload.OrderId}" +
            $"&orderInfo={payload.OrderInfo}" +
            $"&orderType={payload.OrderType}" +
            $"&partnerCode={payload.PartnerCode}" +
            $"&payType={payload.PayType}" +
            $"&requestId={payload.RequestId}" +
            $"&responseTime={payload.ResponseTime}" +
            $"&resultCode={payload.ResultCode}" +
            $"&transId={payload.TransId}";

        return string.Equals(CreateSignature(rawSignature), payload.Signature, StringComparison.OrdinalIgnoreCase);
    }

    private string CreateSignature(string rawSignature)
    {
        var keyBytes = Encoding.UTF8.GetBytes(_options.SecretKey);
        var dataBytes = Encoding.UTF8.GetBytes(rawSignature);
        using var hmac = new HMACSHA256(keyBytes);
        return Convert.ToHexString(hmac.ComputeHash(dataBytes)).ToLowerInvariant();
    }
}

public record MomoCreatePaymentResult(
    string OrderId,
    string RequestId,
    string? PayUrl,
    string? Deeplink,
    string? QrCodeUrl,
    string Message);

public record MomoCreatePaymentGatewayResponse(
    string? PayUrl,
    string? Deeplink,
    string? QrCodeUrl,
    string? Message,
    int? ResultCode);

public record MomoIpnPayload(
    string PartnerCode,
    string OrderId,
    string RequestId,
    long Amount,
    string OrderInfo,
    string OrderType,
    string TransId,
    int ResultCode,
    string Message,
    string PayType,
    long ResponseTime,
    string ExtraData,
    string Signature);
