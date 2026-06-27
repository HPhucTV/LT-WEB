using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelTour.Api.Services;

namespace TravelTour.Api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController(PaymentService paymentService) : ControllerBase
{
    [Authorize]
    [HttpPost("vnpay/bookings/{bookingId:int}")]
    public async Task<IActionResult> CreateVnpayPayment(int bookingId, [FromQuery] string? stage, CancellationToken cancellationToken)
    {
        var result = await paymentService.CreateVnpayPaymentAsync(bookingId, stage ?? "shared", GetClientIpAddress(), cancellationToken);
        if (result.IsNotFound) return NotFound();
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [AllowAnonymous]
    [HttpGet("vnpay/return")]
    public async Task<IActionResult> VnpayReturn(CancellationToken cancellationToken)
    {
        var result = await paymentService.HandleVnpayReturnAsync(Request.Query, cancellationToken);
        return Redirect(result.RedirectUrl);
    }

    private string GetClientIpAddress()
    {
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
    }
}
