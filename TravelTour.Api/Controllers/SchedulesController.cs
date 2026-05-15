using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Contracts;
using TravelTour.Api.Data;

namespace TravelTour.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/schedules")]
public class SchedulesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? tourId, [FromQuery] string? status)
    {
        var query = db.TourSchedules
            .AsNoTracking()
            .Include(s => s.Tour)
            .AsQueryable();

        if (tourId is not null)
        {
            query = query.Where(s => s.TourId == tourId);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(s => s.Status == status.Trim());
        }

        var schedules = await query
            .OrderBy(s => s.StartDate)
            .Select(s => new ScheduleResponse(
                s.Id,
                s.TourId,
                s.Tour!.Name,
                s.StartDate,
                s.EndDate,
                s.AvailableSeats,
                s.Status,
                s.GuideUserId,
                s.GuideName,
                s.Note,
                db.Bookings
                    .Where(b => b.TourScheduleId == s.Id && b.Status != "Cancelled")
                    .Sum(b => (int?)b.GuestCount) ?? 0))
            .ToListAsync();

        return Ok(schedules);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ScheduleRequest request)
    {
        var schedule = await db.TourSchedules
            .Include(s => s.Tour)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (schedule is null)
        {
            return NotFound();
        }

        var error = Validate(request);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }

        schedule.StartDate = request.StartDate;
        schedule.EndDate = request.EndDate;
        schedule.AvailableSeats = request.AvailableSeats;
        schedule.Status = request.Status.Trim();
        var guide = await ResolveGuide(request.GuideUserId);
        if (request.GuideUserId is not null && guide is null)
        {
            return BadRequest(new { message = "Hướng dẫn viên không hợp lệ." });
        }

        if (guide is not null && await HasGuideConflict(guide.Id, request.StartDate, request.EndDate, schedule.Id))
        {
            return BadRequest(new { message = "Hướng dẫn viên đã có tour trong khoảng thời gian này." });
        }

        schedule.GuideUserId = guide?.Id;
        schedule.GuideName = guide?.FullName ?? (string.IsNullOrWhiteSpace(request.GuideName) ? null : request.GuideName.Trim());
        schedule.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        await db.SaveChangesAsync();

        return Ok(new ScheduleResponse(
            schedule.Id, schedule.TourId, schedule.Tour!.Name,
            schedule.StartDate, schedule.EndDate, schedule.AvailableSeats, schedule.Status,
            schedule.GuideUserId, schedule.GuideName, schedule.Note, await CountBookedSeats(id)));
    }

    [HttpPut("{id:int}/assign-guide")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignGuide(int id, AssignGuideRequest request)
    {
        var schedule = await db.TourSchedules.Include(s => s.Tour).FirstOrDefaultAsync(s => s.Id == id);
        if (schedule is null) return NotFound();

        var guide = await ResolveGuide(request.GuideUserId);
        if (request.GuideUserId is not null && guide is null)
        {
            return BadRequest(new { message = "Hướng dẫn viên không hợp lệ." });
        }

        if (guide is not null && await HasGuideConflict(guide.Id, schedule.StartDate, schedule.EndDate, schedule.Id))
        {
            return BadRequest(new { message = "Hướng dẫn viên đã có tour trong khoảng thời gian này." });
        }

        schedule.GuideUserId = guide?.Id;
        schedule.GuideName = guide?.FullName;

        await db.SaveChangesAsync();

        return Ok(new ScheduleResponse(
            schedule.Id, schedule.TourId, schedule.Tour!.Name,
            schedule.StartDate, schedule.EndDate, schedule.AvailableSeats, schedule.Status,
            schedule.GuideUserId, schedule.GuideName, schedule.Note, await CountBookedSeats(id)));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var schedule = await db.TourSchedules.FirstOrDefaultAsync(s => s.Id == id);
        if (schedule is null)
        {
            return NotFound();
        }

        var hasBookings = await db.Bookings.AnyAsync(b => b.TourScheduleId == id);
        if (hasBookings)
        {
            return BadRequest(new { message = "Không thể xoá lịch đang có đặt tour. Hãy xoá đặt tour trước." });
        }

        db.TourSchedules.Remove(schedule);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static string? Validate(ScheduleRequest r)
    {
        if (r.EndDate < r.StartDate) return "Ngày kết thúc phải sau ngày bắt đầu.";
        if (r.AvailableSeats <= 0) return "Số chỗ phải lớn hơn 0.";
        if (string.IsNullOrWhiteSpace(r.Status)) return "Trạng thái không được để trống.";
        return null;
    }

    private async Task<int> CountBookedSeats(int scheduleId)
    {
        return await db.Bookings
            .Where(b => b.TourScheduleId == scheduleId && b.Status != "Cancelled")
            .SumAsync(b => (int?)b.GuestCount) ?? 0;
    }

    private async Task<TravelTour.Api.Models.User?> ResolveGuide(int? guideUserId)
    {
        if (guideUserId is null) return null;

        return await db.Users
            .FirstOrDefaultAsync(u => u.Id == guideUserId && u.Role == "Staff");
    }

    private async Task<bool> HasGuideConflict(int guideUserId, DateOnly startDate, DateOnly endDate, int? excludeScheduleId = null)
    {
        return await db.TourSchedules.AnyAsync(s =>
            s.GuideUserId == guideUserId &&
            s.Status != "Cancelled" &&
            (!excludeScheduleId.HasValue || s.Id != excludeScheduleId.Value) &&
            s.StartDate <= endDate &&
            s.EndDate >= startDate);
    }
}
