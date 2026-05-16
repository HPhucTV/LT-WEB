using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using TravelTour.Api.Models;
using TravelTour.Api.Options;

namespace TravelTour.Api.Services;

public class VnpayPaymentService(IOptions<VnpayOptions> options)
{
    private readonly VnpayOptions _options = options.Value;

    public VnpayCreatePaymentResult CreatePaymentUrl(Booking booking, string ipAddress)
    {
        if (string.IsNullOrWhiteSpace(_options.TmnCode) ||
            string.IsNullOrWhiteSpace(_options.HashSecret) ||
            string.IsNullOrWhiteSpace(_options.PaymentUrl))
        {
            throw new InvalidOperationException("Chua cau hinh day du thong tin VNPay.");
        }

        var now = DateTime.UtcNow.AddHours(7);
        var amount = decimal.ToInt64(decimal.Round(booking.TotalAmount, 0, MidpointRounding.AwayFromZero)) * 100;
        var transactionRef = $"{booking.Id}{now:HHmmssfff}";

        var parameters = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["vnp_Version"] = "2.1.0",
            ["vnp_Command"] = "pay",
            ["vnp_TmnCode"] = _options.TmnCode,
            ["vnp_Amount"] = amount.ToString(CultureInfo.InvariantCulture),
            ["vnp_CreateDate"] = now.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture),
            ["vnp_CurrCode"] = "VND",
            ["vnp_IpAddr"] = NormalizeIpAddress(ipAddress),
            ["vnp_Locale"] = "vn",
            ["vnp_OrderInfo"] = $"Thanh toan booking #{booking.Id}",
            ["vnp_OrderType"] = "other",
            ["vnp_ReturnUrl"] = _options.ReturnUrl,
            ["vnp_TxnRef"] = transactionRef
        };

        var secureHash = CreateSignature(parameters);
        var paymentUrl = $"{_options.PaymentUrl}?{BuildQueryString(parameters)}&vnp_SecureHash={secureHash}";

        return new VnpayCreatePaymentResult(transactionRef, paymentUrl, "Da tao yeu cau thanh toan VNPay.");
    }

    public bool VerifyReturn(IQueryCollection query)
    {
        var parameters = query
            .Where(item => item.Key.StartsWith("vnp_", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(item.Key, "vnp_SecureHash", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(item.Key, "vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
            .ToDictionary(item => item.Key, item => item.Value.ToString());

        var sorted = new SortedDictionary<string, string>(parameters, StringComparer.Ordinal);
        var receivedHash = query["vnp_SecureHash"].ToString();

        return string.Equals(CreateSignature(sorted), receivedHash, StringComparison.OrdinalIgnoreCase);
    }

    public string BuildClientRedirectUrl(IQueryCollection query, string status)
    {
        var parameters = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["gateway"] = "vnpay",
            ["status"] = status
        };

        foreach (var item in query)
        {
            if (item.Key.StartsWith("vnp_", StringComparison.OrdinalIgnoreCase))
            {
                parameters[item.Key] = item.Value.ToString();
            }
        }

        return $"{_options.ClientReturnUrl}?{BuildQueryString(parameters)}";
    }

    private string CreateSignature(SortedDictionary<string, string> parameters)
    {
        var hashData = BuildQueryString(parameters);
        var keyBytes = Encoding.UTF8.GetBytes(_options.HashSecret);
        var dataBytes = Encoding.UTF8.GetBytes(hashData);

        using var hmac = new HMACSHA512(keyBytes);
        return Convert.ToHexString(hmac.ComputeHash(dataBytes)).ToLowerInvariant();
    }

    private static string BuildQueryString(SortedDictionary<string, string> parameters)
    {
        return string.Join("&", parameters
            .Where(item => !string.IsNullOrWhiteSpace(item.Value))
            .Select(item => $"{WebUtility.UrlEncode(item.Key)}={WebUtility.UrlEncode(item.Value)}"));
    }

    private static string NormalizeIpAddress(string ipAddress)
    {
        return ipAddress is "::1" or "0:0:0:0:0:0:0:1" || string.IsNullOrWhiteSpace(ipAddress)
            ? "127.0.0.1"
            : ipAddress;
    }
}

public record VnpayCreatePaymentResult(
    string TransactionRef,
    string PaymentUrl,
    string Message);
