using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Contracts;
using TravelTour.Api.Data;
using TravelTour.Api.Models;
using TravelTour.Api.Services;

namespace TravelTour.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/tours")]
public class ToursController(AppDbContext db, CacheService cache) : ControllerBase
{
    private const string CacheKey = "tours:all";
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        // 1️⃣ Kiểm tra Redis cache trước
        var cached = await cache.GetAsync<List<TourResponse>>(CacheKey);
        if (cached != null) return Ok(cached);

        // 2️⃣ Cache MISS → query PostgreSQL
        var result = await db.Tours
            .AsNoTracking()
            .OrderBy(tour => tour.Name)
            .Select(tour => new TourResponse(
                tour.Id,
                tour.Code,
                tour.Name,
                tour.Destination,
                tour.DurationDays,
                tour.Price,
                tour.OriginalPrice,
                tour.MaxGuests,
                tour.Category,
                tour.Description,
                tour.ImageUrl,
                tour.IsActive))
            .ToListAsync();

        // 3️⃣ Lưu vào Redis cache (hết hạn sau 5 phút)
        await cache.SetAsync(CacheKey, result);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var tour = await db.Tours.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);

        return tour is null ? NotFound() : Ok(ToResponse(tour));
    }

    [HttpPost]
    public async Task<IActionResult> Create(TourRequest request)
    {
        var error = Validate(request);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }

        var tour = new Tour
        {
            Code = request.Code.Trim(),
            Name = request.Name.Trim(),
            Destination = request.Destination.Trim(),
            DurationDays = request.DurationDays,
            Price = request.Price,
            OriginalPrice = request.OriginalPrice,
            MaxGuests = request.MaxGuests,
            Category = request.Category?.Trim() ?? "Khám phá",
            Description = request.Description.Trim(),
            ImageUrl = request.ImageUrl.Trim(),
            IsActive = request.IsActive
        };

        db.Tours.Add(tour);
        await db.SaveChangesAsync();

        // ⚡ Xóa cache cũ vì dữ liệu đã thay đổi
        await cache.RemoveAsync(CacheKey);

        return CreatedAtAction(nameof(GetById), new { id = tour.Id }, ToResponse(tour));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, TourRequest request)
    {
        var tour = await db.Tours.FirstOrDefaultAsync(t => t.Id == id);
        if (tour is null)
        {
            return NotFound();
        }

        var error = Validate(request);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }

        tour.Code = request.Code.Trim();
        tour.Name = request.Name.Trim();
        tour.Destination = request.Destination.Trim();
        tour.DurationDays = request.DurationDays;
        tour.Price = request.Price;
        tour.OriginalPrice = request.OriginalPrice;
        tour.MaxGuests = request.MaxGuests;
        tour.Category = request.Category?.Trim() ?? "Khám phá";
        tour.Description = request.Description.Trim();
        tour.ImageUrl = request.ImageUrl.Trim();
        tour.IsActive = request.IsActive;

        await db.SaveChangesAsync();

        // ⚡ Xóa cache cũ
        await cache.RemoveAsync(CacheKey);

        return Ok(ToResponse(tour));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var tour = await db.Tours.FirstOrDefaultAsync(t => t.Id == id);
        if (tour is null)
        {
            return NotFound();
        }

        var hasSchedules = await db.TourSchedules.AnyAsync(s => s.TourId == id);
        if (hasSchedules)
        {
            return BadRequest(new { message = "Không thể xoá tour đang có lịch khởi hành. Hãy xoá lịch trước." });
        }

        db.Tours.Remove(tour);
        await db.SaveChangesAsync();

        // ⚡ Xóa cache
        await cache.RemoveAsync(CacheKey);

        return NoContent();
    }

    // ─── Schedule endpoints nested under tours ──────────────────────────────

    [HttpGet("{id:int}/schedules")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSchedules(int id)
    {
        var exists = await db.Tours.AnyAsync(t => t.Id == id);
        if (!exists)
        {
            return NotFound();
        }

        var schedules = await db.TourSchedules
            .AsNoTracking()
            .Where(s => s.TourId == id)
            .Include(s => s.Tour)
            .OrderBy(s => s.StartDate)
            .Select(s => new ScheduleResponse(
                s.Id, s.TourId, s.Tour!.Name,
                s.StartDate, s.EndDate, s.AvailableSeats, s.Status,
                s.GuideUserId, s.GuideName, s.Note,
                db.Bookings
                    .Where(b => b.TourScheduleId == s.Id && b.Status != "Cancelled")
                    .Sum(b => (int?)b.GuestCount) ?? 0))
            .ToListAsync();

        return Ok(schedules);
    }

    [HttpPost("{id:int}/schedules")]
    public async Task<IActionResult> CreateSchedule(int id, ScheduleRequest request)
    {
        var tour = await db.Tours.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);
        if (tour is null)
        {
            return NotFound();
        }

        var error = ValidateSchedule(request);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }

        var guide = await ResolveGuide(request.GuideUserId);
        if (request.GuideUserId is not null && guide is null)
        {
            return BadRequest(new { message = "Hướng dẫn viên không hợp lệ." });
        }

        if (guide is not null && await HasGuideConflict(guide.Id, request.StartDate, request.EndDate))
        {
            return BadRequest(new { message = "Hướng dẫn viên đã có tour trong khoảng thời gian này." });
        }

        var schedule = new TourSchedule
        {
            TourId = id,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            AvailableSeats = request.AvailableSeats,
            Status = request.Status.Trim(),
            GuideUserId = guide?.Id,
            GuideName = guide?.FullName ?? (string.IsNullOrWhiteSpace(request.GuideName) ? null : request.GuideName.Trim()),
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        };

        db.TourSchedules.Add(schedule);
        await db.SaveChangesAsync();

        return Created($"/api/tours/{id}/schedules", new ScheduleResponse(
            schedule.Id, schedule.TourId, tour.Name,
            schedule.StartDate, schedule.EndDate, schedule.AvailableSeats, schedule.Status,
            schedule.GuideUserId, schedule.GuideName, schedule.Note, 0));
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private static TourResponse ToResponse(Tour tour) =>
        new(tour.Id, tour.Code, tour.Name, tour.Destination,
            tour.DurationDays, tour.Price, tour.OriginalPrice, tour.MaxGuests,
            tour.Category, tour.Description, tour.ImageUrl, tour.IsActive);

    private static string? Validate(TourRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Code)) return "Mã tour không được để trống.";
        if (string.IsNullOrWhiteSpace(r.Name)) return "Tên tour không được để trống.";
        if (r.DurationDays <= 0) return "Số ngày phải lớn hơn 0.";
        if (r.Price < 0) return "Giá tour không được âm.";
        if (r.MaxGuests <= 0) return "Số khách tối đa phải lớn hơn 0.";
        return null;
    }

    private static string? ValidateSchedule(ScheduleRequest r)
    {
        if (r.EndDate < r.StartDate) return "Ngày kết thúc phải sau ngày bắt đầu.";
        if (r.AvailableSeats <= 0) return "Số chỗ phải lớn hơn 0.";
        if (string.IsNullOrWhiteSpace(r.Status)) return "Trạng thái không được để trống.";
        return null;
    }

    private async Task<User?> ResolveGuide(int? guideUserId)
    {
        if (guideUserId is null) return null;

        return await db.Users
            .FirstOrDefaultAsync(u => u.Id == guideUserId && u.Role == "Staff");
    }

    private async Task<bool> HasGuideConflict(int guideUserId, DateOnly startDate, DateOnly endDate)
    {
        return await db.TourSchedules.AnyAsync(s =>
            s.GuideUserId == guideUserId &&
            s.Status != "Cancelled" &&
            s.StartDate <= endDate &&
            s.EndDate >= startDate);
    }
}
