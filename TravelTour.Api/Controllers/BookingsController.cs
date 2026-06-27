using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TravelTour.Api.Contracts;
using TravelTour.Api.Services;

namespace TravelTour.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/bookings")]
public class BookingsController(BookingService bookingService) : ControllerBase
{
    /// <summary>
    /// Chỉ Admin, Sales và Staff mới được xem toàn bộ danh sách booking.
    /// Customer phải dùng GET /api/bookings/mine.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Sales,Staff")]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await bookingService.GetAllAsync());
    }

    /// <summary>
    /// Customer xem danh sách booking của chính mình.
    /// Lọc theo email hoặc tên đăng ký từ JWT claims.
    /// </summary>
    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        var fullName = User.FindFirstValue("fullName");
        // Tạm khớp theo tên/email vì booking chưa lưu UserId.
        // (cải thiện lâu dài: lưu UserId vào Booking)
        var customerEmail = username?.Contains('@') == true ? username : null;
        var result = await bookingService.GetMineAsync(customerEmail, fullName, username);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(BookingRequest request)
    {
        var result = await bookingService.CreateAsync(request);
        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Created($"/api/bookings/{result.Value!.Id}", result.Value);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> UpdateStatus(int id, BookingStatusUpdate update)
    {
        var result = await bookingService.UpdateStatusAsync(id, update);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpPut("{id:int}/contract-confirmation")]
    [Authorize(Roles = "Admin,Sales")]
    public async Task<IActionResult> ConfirmContract(int id, ContractConfirmationRequest request)
    {
        var result = await bookingService.ConfirmContractAsync(id, request);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpGet("{id:int}/contract")]
    public async Task<IActionResult> GetContract(int id)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        var fullName = User.FindFirstValue("fullName");
        var customerEmail = username?.Contains('@') == true ? username : null;
        var isPrivileged = User.IsInRole("Admin") || User.IsInRole("Sales");
        var result = await bookingService.GetContractAsync(id, customerEmail, fullName, username, isPrivileged);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        if (result.IsForbidden)
        {
            return Forbid();
        }

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpPut("{id:int}/contract-customer-sign")]
    public async Task<IActionResult> SignContract(int id, CustomerContractSignatureRequest request)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        var fullName = User.FindFirstValue("fullName");
        var customerEmail = username?.Contains('@') == true ? username : null;
        var result = await bookingService.SignContractAsync(id, request, customerEmail, fullName, username);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        if (result.IsForbidden)
        {
            return Forbid();
        }

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpPut("{id:int}/assign-guide")]
    [Authorize(Roles = "Admin,Sales")]
    public async Task<IActionResult> AssignGuide(int id, AssignGuideRequest request)
    {
        var result = await bookingService.AssignGuideAsync(id, request);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await bookingService.DeleteAsync(id);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        return NoContent();
    }
}
