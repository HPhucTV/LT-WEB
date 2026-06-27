using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Contracts;
using TravelTour.Api.Data;

namespace TravelTour.Api.Services;

public class PaymentService(AppDbContext db, VnpayPaymentService vnpayPaymentService)
{
    public async Task<ServiceResult<CreateVnpayPaymentResponse>> CreateVnpayPaymentAsync(
        int bookingId,
        string stage,
        string ipAddress,
        CancellationToken cancellationToken)
    {
        var booking = await db.Bookings
            .Include(item => item.TourSchedule!)
                .ThenInclude(schedule => schedule.Tour)
            .Include(item => item.PrivateGroupContract)
            .FirstOrDefaultAsync(item => item.Id == bookingId, cancellationToken);

        if (booking is null) return ServiceResult<CreateVnpayPaymentResponse>.NotFound();
        if (booking.Status == "Cancelled") return ServiceResult<CreateVnpayPaymentResponse>.BadRequest("Booking đã hủy, không thể thanh toán.");

        var normalizedStage = NormalizeStage(stage);
        if (normalizedStage is null)
        {
            return ServiceResult<CreateVnpayPaymentResponse>.BadRequest("Giai đoạn thanh toán không hợp lệ.");
        }

        if (booking.BookingType != "PrivateGroup")
        {
            if (booking.PaymentStatus == "Paid") return ServiceResult<CreateVnpayPaymentResponse>.BadRequest("Booking này đã được thanh toán.");

            var sharedPayment = vnpayPaymentService.CreatePaymentUrl(booking.Id, booking.TotalAmount, ipAddress, "shared");
            booking.PaymentMethod = "VNPay";
            booking.PaymentStatus = "PaymentCreated";
            booking.MomoOrderId = sharedPayment.TransactionRef;
            booking.MomoRequestId = sharedPayment.TransactionRef;

            await db.SaveChangesAsync(cancellationToken);

            return ServiceResult<CreateVnpayPaymentResponse>.Success(new CreateVnpayPaymentResponse(
                booking.Id,
                "shared",
                sharedPayment.TransactionRef,
                sharedPayment.PaymentUrl,
                sharedPayment.Message));
        }

        var contract = booking.PrivateGroupContract;
        if (contract is null)
        {
            return ServiceResult<CreateVnpayPaymentResponse>.BadRequest("Booking đoàn chưa có dữ liệu hợp đồng.");
        }

        if (booking.Status != "Confirmed" || contract.ContractStatus != "Confirmed")
        {
            return ServiceResult<CreateVnpayPaymentResponse>.BadRequest("Booking đoàn cần Sales chốt hợp đồng và phân HDV trước khi thanh toán.");
        }

        if (contract.CustomerSignatureStatus != "Signed")
        {
            return ServiceResult<CreateVnpayPaymentResponse>.BadRequest("Khách hàng cần xác nhận hợp đồng trước khi thanh toán.");
        }

        if (normalizedStage == "deposit")
        {
            if (contract.DepositPaymentStatus == "Paid")
            {
                return ServiceResult<CreateVnpayPaymentResponse>.BadRequest("Booking này đã thanh toán tiền cọc.");
            }

            var depositPayment = vnpayPaymentService.CreatePaymentUrl(booking.Id, contract.DepositAmount, ipAddress, "deposit");
            booking.PaymentMethod = "VNPay";
            booking.PaymentStatus = "PaymentCreated";
            contract.DepositPaymentStatus = "PaymentCreated";
            contract.DepositTransactionRef = depositPayment.TransactionRef;

            await db.SaveChangesAsync(cancellationToken);

            return ServiceResult<CreateVnpayPaymentResponse>.Success(new CreateVnpayPaymentResponse(
                booking.Id,
                "deposit",
                depositPayment.TransactionRef,
                depositPayment.PaymentUrl,
                depositPayment.Message));
        }

        if (contract.DepositPaymentStatus != "Paid")
        {
            return ServiceResult<CreateVnpayPaymentResponse>.BadRequest("Booking đoàn cần thanh toán tiền cọc trước.");
        }

        if (contract.RemainingPaymentStatus == "Paid")
        {
            return ServiceResult<CreateVnpayPaymentResponse>.BadRequest("Booking này đã thanh toán đủ.");
        }

        if (contract.RemainingDueDate is not null && DateOnly.FromDateTime(DateTime.Today) > contract.RemainingDueDate.Value)
        {
            return ServiceResult<CreateVnpayPaymentResponse>.BadRequest("Đã quá hạn thanh toán phần còn lại. Vui lòng liên hệ Sales hoặc Admin.");
        }

        var remainingPayment = vnpayPaymentService.CreatePaymentUrl(booking.Id, contract.RemainingAmount, ipAddress, "remaining");
        booking.PaymentMethod = "VNPay";
        booking.PaymentStatus = "PaymentCreated";
        contract.RemainingPaymentStatus = "PaymentCreated";
        contract.RemainingTransactionRef = remainingPayment.TransactionRef;

        await db.SaveChangesAsync(cancellationToken);

        return ServiceResult<CreateVnpayPaymentResponse>.Success(new CreateVnpayPaymentResponse(
            booking.Id,
            "remaining",
            remainingPayment.TransactionRef,
            remainingPayment.PaymentUrl,
            remainingPayment.Message));
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

        var booking = await db.Bookings
            .Include(item => item.PrivateGroupContract)
            .FirstOrDefaultAsync(item =>
            item.MomoOrderId == transactionRef
            || item.PrivateGroupContract!.DepositTransactionRef == transactionRef
            || item.PrivateGroupContract!.RemainingTransactionRef == transactionRef, cancellationToken);

        if (booking is null)
        {
            return new VnpayReturnResult(true, vnpayPaymentService.BuildClientRedirectUrl(query, "booking-not-found"));
        }

        var stage = ResolveStage(booking, transactionRef);

        if (responseCode == "00" && transactionStatus == "00")
        {
            if (stage == "deposit")
            {
                booking.PrivateGroupContract!.DepositPaymentStatus = "Paid";
                booking.PrivateGroupContract.DepositPaidAt = DateTime.UtcNow;
                booking.PaymentStatus = "DepositPaid";
            }
            else if (stage == "remaining")
            {
                booking.PrivateGroupContract!.RemainingPaymentStatus = "Paid";
                booking.PrivateGroupContract.RemainingPaidAt = DateTime.UtcNow;
                booking.PaymentStatus = "Paid";
                booking.PaidAt = booking.PrivateGroupContract.RemainingPaidAt;
            }
            else
            {
                booking.PaymentStatus = "Paid";
                booking.Status = "Confirmed";
                booking.MomoTransactionId = query["vnp_TransactionNo"].ToString();
                booking.PaidAt = DateTime.UtcNow;
            }
        }
        else
        {
            if (stage == "deposit")
            {
                booking.PrivateGroupContract!.DepositPaymentStatus = "PaymentFailed";
            }
            else if (stage == "remaining")
            {
                booking.PrivateGroupContract!.RemainingPaymentStatus = "PaymentFailed";
            }
            else
            {
                booking.PaymentStatus = "PaymentFailed";
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        var status = responseCode == "00" && transactionStatus == "00" ? "success" : "failed";
        return new VnpayReturnResult(true, vnpayPaymentService.BuildClientRedirectUrl(query, status));
    }

    private static string? NormalizeStage(string? stage)
    {
        if (string.IsNullOrWhiteSpace(stage) || string.Equals(stage, "shared", StringComparison.OrdinalIgnoreCase))
        {
            return "shared";
        }

        if (string.Equals(stage, "deposit", StringComparison.OrdinalIgnoreCase))
        {
            return "deposit";
        }

        if (string.Equals(stage, "remaining", StringComparison.OrdinalIgnoreCase))
        {
            return "remaining";
        }

        return null;
    }

    private static string ResolveStage(Models.Booking booking, string transactionRef)
    {
        if (booking.PrivateGroupContract?.DepositTransactionRef == transactionRef)
        {
            return "deposit";
        }

        if (booking.PrivateGroupContract?.RemainingTransactionRef == transactionRef)
        {
            return "remaining";
        }

        return "shared";
    }
}

public record VnpayReturnResult(bool IsValidSignature, string RedirectUrl);
