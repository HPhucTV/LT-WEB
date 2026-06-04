using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Contracts;
using TravelTour.Api.Data;

namespace TravelTour.Api.Services;

public class PaymentService(AppDbContext db, VnpayPaymentService vnpayPaymentService)
{
    public async Task<ServiceResult<CreateVnpayPaymentResponse>> CreateVnpayPaymentAsync(
        int bookingId,
        string ipAddress,
        CancellationToken cancellationToken)
    {
        var booking = await db.Bookings
            .Include(item => item.TourSchedule!)
                .ThenInclude(schedule => schedule.Tour)
            .FirstOrDefaultAsync(item => item.Id == bookingId, cancellationToken);

        if (booking is null) return ServiceResult<CreateVnpayPaymentResponse>.NotFound();
        if (booking.Status == "Cancelled") return ServiceResult<CreateVnpayPaymentResponse>.BadRequest("Booking đã hủy, không thể thanh toán.");
        if (booking.PaymentStatus == "Paid") return ServiceResult<CreateVnpayPaymentResponse>.BadRequest("Booking này đã được thanh toán.");

        if (booking.BookingType == "PrivateGroup" && booking.Status != "Confirmed")
        {
            return ServiceResult<CreateVnpayPaymentResponse>.BadRequest("Booking đoàn cần admin phân lịch và xác nhận trước khi thanh toán.");
        }

        var payment = vnpayPaymentService.CreatePaymentUrl(booking, ipAddress);

        booking.PaymentMethod = "VNPay";
        booking.PaymentStatus = "PaymentCreated";
        booking.MomoOrderId = payment.TransactionRef;
        booking.MomoRequestId = payment.TransactionRef;

        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<CreateVnpayPaymentResponse>.Success(new CreateVnpayPaymentResponse(
            booking.Id,
            payment.TransactionRef,
            payment.PaymentUrl,
            payment.Message));
    }

    public async Task<VnpayReturnResult> HandleVnpayReturnAsync(IQueryCollection query, CancellationToken cancellationToken)
    {
        var isValidSignature = vnpayPaymentService.VerifyReturn(query);
        if (!isValidSignature)
        {
            return new VnpayReturnResult(false, vnpayPaymentService.BuildClientRedirectUrl(query, "invalid-signature"));
        }

        var transactionRef = query["vnp_TxnRef"].ToString();
        var responseCode = query["vnp_ResponseCode"].ToString();
        var transactionStatus = query["vnp_TransactionStatus"].ToString();

        var booking = await db.Bookings.FirstOrDefaultAsync(item => item.MomoOrderId == transactionRef, cancellationToken);
        if (booking is null)
        {
            return new VnpayReturnResult(true, vnpayPaymentService.BuildClientRedirectUrl(query, "booking-not-found"));
        }

        if (responseCode == "00" && transactionStatus == "00")
        {
            booking.PaymentStatus = "Paid";
            booking.Status = "Confirmed";
            booking.MomoTransactionId = query["vnp_TransactionNo"].ToString();
            booking.PaidAt = DateTime.UtcNow;
        }
        else
        {
            booking.PaymentStatus = "PaymentFailed";
        }

        await db.SaveChangesAsync(cancellationToken);

        var status = booking.PaymentStatus == "Paid" ? "success" : "failed";
        return new VnpayReturnResult(true, vnpayPaymentService.BuildClientRedirectUrl(query, status));
    }

}

public record VnpayReturnResult(bool IsValidSignature, string RedirectUrl);
