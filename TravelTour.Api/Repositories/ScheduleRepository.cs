using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Data;
using TravelTour.Api.Models;

namespace TravelTour.Api.Repositories;

public class ScheduleRepository(AppDbContext db) : IScheduleRepository
{
    public async Task<List<TourSchedule>> GetAllAsync(int? tourId = null, string? status = null)
    {
        var query = db.TourSchedules
            .AsNoTracking()
            .Include(schedule => schedule.Tour)
            .AsQueryable();

        if (tourId is not null)
        {
            query = query.Where(schedule => schedule.TourId == tourId);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(schedule => schedule.Status == status.Trim());
        }

        return await query.OrderBy(schedule => schedule.StartDate).ToListAsync();
    }

    public async Task<List<TourSchedule>> GetByTourIdAsync(int tourId)
    {
        return await db.TourSchedules
            .AsNoTracking()
            .Include(schedule => schedule.Tour)
            .Where(schedule => schedule.TourId == tourId)
            .OrderBy(schedule => schedule.StartDate)
            .ToListAsync();
    }

    public async Task<TourSchedule?> GetByIdAsync(int id, bool includeTour = false)
    {
        var query = db.TourSchedules.AsQueryable();
        if (includeTour)
        {
            query = query.Include(schedule => schedule.Tour);
        }

        return await query.FirstOrDefaultAsync(schedule => schedule.Id == id);
    }

    public async Task<bool> HasBookingsAsync(int id)
    {
        return await db.Bookings.AnyAsync(booking => booking.TourScheduleId == id);
    }

    public async Task<int> CountBookedSeatsAsync(int id)
    {
        return await db.Bookings
            .Where(booking => booking.TourScheduleId == id && booking.Status != "Cancelled")
            .SumAsync(booking => (int?)booking.GuestCount) ?? 0;
    }

    public async Task<Dictionary<int, int>> GetBookedSeatsCountsAsync(IEnumerable<int> scheduleIds)
    {
        if (!scheduleIds.Any()) return new Dictionary<int, int>();

        return await db.Bookings
            .AsNoTracking()
            .Where(b => scheduleIds.Contains(b.TourScheduleId) && b.Status != "Cancelled")
            .GroupBy(b => b.TourScheduleId)
            .Select(g => new { ScheduleId = g.Key, Count = g.Sum(b => (int?)b.GuestCount) ?? 0 })
            .ToDictionaryAsync(x => x.ScheduleId, x => x.Count);
    }

    public async Task<bool> HasGuideConflictAsync(int guideUserId, DateOnly startDate, DateOnly endDate, int? excludeScheduleId = null)
    {
        return await db.TourSchedules.AnyAsync(schedule =>
            schedule.GuideUserId == guideUserId &&
            schedule.Status != "Cancelled" &&
            (!excludeScheduleId.HasValue || schedule.Id != excludeScheduleId.Value) &&
            schedule.StartDate <= endDate &&
            schedule.EndDate >= startDate);
    }

    public void Add(TourSchedule schedule)
    {
        db.TourSchedules.Add(schedule);
    }

    public void Remove(TourSchedule schedule)
    {
        db.TourSchedules.Remove(schedule);
    }

    public Task SaveChangesAsync()
    {
        return db.SaveChangesAsync();
    }
}
