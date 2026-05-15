using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Contracts;
using TravelTour.Api.Data;
using TravelTour.Api.Models;

namespace TravelTour.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/bookings")]
public class BookingsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await db.Bookings
            .AsNoTracking()
            .Include(b => b.TourSchedule!)
                .ThenInclude(s => s.Tour)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BookingResponse(
                b.Id,
                b.TourScheduleId,
                b.TourSchedule!.Tour!.Name,
                b.TourSchedule.StartDate,
                b.CustomerName,
                b.CustomerPhone,
                b.GuestCount,
                b.TotalAmount,
                b.Status,
                b.PaymentMethod,
                b.PaymentStatus,
                b.CreatedAt))
            .ToListAsync();

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(BookingRequest request)
    {
        var error = Validate(request);
        if (error is not null)
            return BadRequest(new { message = error });

        var schedule = await db.TourSchedules
            .Include(s => s.Tour)
            .FirstOrDefaultAsync(s => s.Id == request.TourScheduleId);

        if (schedule is null)
            return BadRequest(new { message = "Lịch khởi hành không tồn tại." });

        if (schedule.Status != "Open")
            return BadRequest(new { message = "Lịch khởi hành này đã đóng, không thể đặt tour." });

        if (request.GuestCount > schedule.AvailableSeats)
            return BadRequest(new { message = $"Chỉ còn {schedule.AvailableSeats} chỗ trống." });

        var totalAmount = schedule.Tour!.Price * request.GuestCount;

        var booking = new Booking
        {
            TourScheduleId = request.TourScheduleId,
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            GuestCount = request.GuestCount,
            TotalAmount = totalAmount,
            Status = "Pending"
        };

        schedule.AvailableSeats -= request.GuestCount;

        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        return Created($"/api/bookings/{booking.Id}", new BookingResponse(
            booking.Id, booking.TourScheduleId, schedule.Tour.Name, schedule.StartDate,
            booking.CustomerName, booking.CustomerPhone, booking.GuestCount,
            booking.TotalAmount, booking.Status, booking.PaymentMethod, booking.PaymentStatus,
            booking.CreatedAt));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateStatus(int id, BookingStatusUpdate update)
    {
        var booking = await db.Bookings
            .Include(b => b.TourSchedule!)
                .ThenInclude(s => s.Tour)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null)
            return NotFound();

        if (update.Status == "Cancelled" && booking.Status != "Cancelled")
            booking.TourSchedule!.AvailableSeats += booking.GuestCount;

        booking.Status = update.Status.Trim();
        await db.SaveChangesAsync();

        return Ok(new BookingResponse(
            booking.Id, booking.TourScheduleId, booking.TourSchedule!.Tour!.Name,
            booking.TourSchedule.StartDate, booking.CustomerName, booking.CustomerPhone,
            booking.GuestCount, booking.TotalAmount, booking.Status, booking.PaymentMethod,
            booking.PaymentStatus, booking.CreatedAt));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var booking = await db.Bookings
            .Include(b => b.TourSchedule)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null)
            return NotFound();

        if (booking.Status != "Cancelled")
            booking.TourSchedule!.AvailableSeats += booking.GuestCount;

        db.Bookings.Remove(booking);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static string? Validate(BookingRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.CustomerName)) return "Tên khách hàng không được để trống.";
        if (string.IsNullOrWhiteSpace(r.CustomerPhone)) return "Số điện thoại không được để trống.";
        if (r.GuestCount <= 0) return "Số khách phải lớn hơn 0.";
        return null;
    }
}
