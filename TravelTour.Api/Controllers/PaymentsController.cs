using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Contracts;
using TravelTour.Api.Data;
using TravelTour.Api.Services;

namespace TravelTour.Api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController(AppDbContext db, MomoPaymentService momoPaymentService) : ControllerBase
{
    [Authorize]
    [HttpPost("momo/bookings/{bookingId:int}")]
    public async Task<IActionResult> CreateMomoPayment(int bookingId, CancellationToken cancellationToken)
    {
        var booking = await db.Bookings
            .Include(item => item.TourSchedule!)
                .ThenInclude(schedule => schedule.Tour)
            .FirstOrDefaultAsync(item => item.Id == bookingId, cancellationToken);

        if (booking is null)
        {
            return NotFound();
        }

        if (booking.Status == "Cancelled")
        {
            return BadRequest(new { message = "Booking da huy, khong the thanh toan." });
        }

        if (booking.PaymentStatus == "Paid")
        {
            return BadRequest(new { message = "Booking nay da duoc thanh toan." });
        }

        var payment = await momoPaymentService.CreatePaymentAsync(booking, cancellationToken);

        booking.PaymentMethod = "MoMo";
        booking.PaymentStatus = "PaymentCreated";
        booking.MomoOrderId = payment.OrderId;
        booking.MomoRequestId = payment.RequestId;

        await db.SaveChangesAsync(cancellationToken);

        return Ok(new CreateMomoPaymentResponse(
            booking.Id,
            payment.OrderId,
            payment.RequestId,
            payment.PayUrl,
            payment.Deeplink,
            payment.QrCodeUrl,
            payment.Message));
    }

    [AllowAnonymous]
    [HttpPost("momo/ipn")]
    public async Task<IActionResult> MomoIpn(MomoIpnRequest request, CancellationToken cancellationToken)
    {
        var payload = new MomoIpnPayload(
            request.PartnerCode ?? string.Empty,
            request.OrderId ?? string.Empty,
            request.RequestId ?? string.Empty,
            request.Amount,
            request.OrderInfo ?? string.Empty,
            request.OrderType ?? string.Empty,
            request.TransId?.ToString() ?? string.Empty,
            request.ResultCode,
            request.Message ?? string.Empty,
            request.PayType ?? string.Empty,
            request.ResponseTime,
            request.ExtraData ?? string.Empty,
            request.Signature ?? string.Empty);

        if (!momoPaymentService.VerifyIpnSignature(payload))
        {
            return BadRequest(new { message = "Invalid signature" });
        }

        var booking = await db.Bookings
            .FirstOrDefaultAsync(item => item.MomoOrderId == payload.OrderId, cancellationToken);

        if (booking is null)
        {
            return Ok(new { status = "BookingNotFound" });
        }

        if (payload.ResultCode == 0)
        {
            booking.PaymentStatus = "Paid";
            booking.Status = "Confirmed";
            booking.MomoTransactionId = payload.TransId;
            booking.PaidAt = DateTime.UtcNow;
        }
        else
        {
            booking.PaymentStatus = "PaymentFailed";
        }

        await db.SaveChangesAsync(cancellationToken);

        return Ok(new { status = "OK" });
    }
}
