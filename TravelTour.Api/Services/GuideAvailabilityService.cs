using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Contracts;
using TravelTour.Api.Data;
using TravelTour.Api.Models;

namespace TravelTour.Api.Services;

public class GuideAvailabilityService(AppDbContext db)
{
    public async Task<ServiceResult<List<GuideAvailabilityResponse>>> GetMineAsync(string? username)
    {
        var guide = await GetCurrentUser(username);
        if (guide is null) return ServiceResult<List<GuideAvailabilityResponse>>.BadRequest("Unauthorized");

        var items = await db.GuideAvailabilities
            .AsNoTracking()
            .Where(a => a.GuideUserId == guide.Id)
            .OrderByDescending(a => a.StartDate)
            .Select(a => new GuideAvailabilityResponse(
                a.Id, a.GuideUserId, guide.FullName,
                a.StartDate, a.EndDate, a.Status, a.Note, a.CreatedAt))
            .ToListAsync();

        return ServiceResult<List<GuideAvailabilityResponse>>.Success(items);
    }

    public async Task<ServiceResult<GuideAvailabilityResponse>> CreateAsync(string? username, GuideAvailabilityRequest request)
    {
        var guide = await GetCurrentUser(username);
        if (guide is null) return ServiceResult<GuideAvailabilityResponse>.BadRequest("Unauthorized");

        var error = await ValidateAvailability(guide.Id, request.StartDate, request.EndDate);
        if (error is not null) return ServiceResult<GuideAvailabilityResponse>.BadRequest(error);

        var availability = new GuideAvailability
        {
            GuideUserId = guide.Id,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            Status = "Available"
        };

        db.GuideAvailabilities.Add(availability);
        await db.SaveChangesAsync();

        return ServiceResult<GuideAvailabilityResponse>.Success(ToResponse(availability, guide));
    }

    public async Task<ServiceResult<GuideAvailabilityResponse>> UpdateAsync(string? username, int id, GuideAvailabilityRequest request)
    {
        var guide = await GetCurrentUser(username);
        if (guide is null) return ServiceResult<GuideAvailabilityResponse>.BadRequest("Unauthorized");

        var availability = await db.GuideAvailabilities.FirstOrDefaultAsync(a => a.Id == id && a.GuideUserId == guide.Id);
        if (availability is null) return ServiceResult<GuideAvailabilityResponse>.NotFound();

        var error = await ValidateAvailability(guide.Id, request.StartDate, request.EndDate, id);
        if (error is not null) return ServiceResult<GuideAvailabilityResponse>.BadRequest(error);

        availability.StartDate = request.StartDate;
        availability.EndDate = request.EndDate;
        availability.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        availability.Status = "Available";

        await db.SaveChangesAsync();
        return ServiceResult<GuideAvailabilityResponse>.Success(ToResponse(availability, guide));
    }

    public async Task<ServiceResult> DeleteAsync(string? username, int id)
    {
        var guide = await GetCurrentUser(username);
        if (guide is null) return ServiceResult.BadRequest("Unauthorized");

        var availability = await db.GuideAvailabilities.FirstOrDefaultAsync(a => a.Id == id && a.GuideUserId == guide.Id);
        if (availability is null) return ServiceResult.NotFound();

        db.GuideAvailabilities.Remove(availability);
        await db.SaveChangesAsync();
        return ServiceResult.Success();
    }

    public async Task<ServiceResult<List<AvailableGuideResponse>>> GetAvailableGuidesAsync(DateOnly startDate, DateOnly endDate)
    {
        if (endDate < startDate)
        {
            return ServiceResult<List<AvailableGuideResponse>>.BadRequest("Ngày kết thúc phải sau ngày bắt đầu.");
        }

        var busyGuideIds = db.TourSchedules
            .Where(s => s.GuideUserId != null
                && s.Status != "Cancelled"
                && s.StartDate <= endDate
                && s.EndDate >= startDate)
            .Select(s => s.GuideUserId!.Value);

        var guides = await db.GuideAvailabilities
            .AsNoTracking()
            .Where(a => a.Status == "Available"
                && a.StartDate <= startDate
                && a.EndDate >= endDate
                && !busyGuideIds.Contains(a.GuideUserId))
            .Include(a => a.GuideUser)
            .OrderBy(a => a.GuideUser!.FullName)
            .Select(a => new AvailableGuideResponse(
                a.GuideUserId,
                a.GuideUser!.Username,
                a.GuideUser.FullName,
                a.Note ?? ""))
            .Distinct()
            .ToListAsync();

        return ServiceResult<List<AvailableGuideResponse>>.Success(guides);
    }

    private async Task<User?> GetCurrentUser(string? username)
    {
        return string.IsNullOrWhiteSpace(username)
            ? null
            : await db.Users.FirstOrDefaultAsync(u => u.Username == username);
    }

    private async Task<string?> ValidateAvailability(int guideUserId, DateOnly startDate, DateOnly endDate, int? excludeAvailabilityId = null)
    {
        if (endDate < startDate) return "Ngày kết thúc phải sau ngày bắt đầu.";

        var overlapsAvailability = await db.GuideAvailabilities.AnyAsync(a =>
            a.GuideUserId == guideUserId &&
            (!excludeAvailabilityId.HasValue || a.Id != excludeAvailabilityId.Value) &&
            a.StartDate <= endDate &&
            a.EndDate >= startDate);
        if (overlapsAvailability) return "Khoảng lịch trống này đang bị trùng với lịch đã khai báo.";

        var overlapsAssignedTour = await db.TourSchedules.AnyAsync(s =>
            s.GuideUserId == guideUserId &&
            s.Status != "Cancelled" &&
            s.StartDate <= endDate &&
            s.EndDate >= startDate);
        if (overlapsAssignedTour) return "Bạn đã được xếp tour trong khoảng thời gian này.";

        return null;
    }

    private static GuideAvailabilityResponse ToResponse(GuideAvailability availability, User guide)
    {
        return new GuideAvailabilityResponse(
            availability.Id,
            availability.GuideUserId,
            guide.FullName,
            availability.StartDate,
            availability.EndDate,
            availability.Status,
            availability.Note,
            availability.CreatedAt);
    }
}
