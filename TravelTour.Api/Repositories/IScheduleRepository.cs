using TravelTour.Api.Models;

namespace TravelTour.Api.Repositories;

public interface IScheduleRepository
{
    Task<List<TourSchedule>> GetAllAsync(int? tourId = null, string? status = null);
    Task<List<TourSchedule>> GetByTourIdAsync(int tourId);
    Task<TourSchedule?> GetByIdAsync(int id, bool includeTour = false);
    Task<bool> HasBookingsAsync(int id);
    Task<int> CountBookedSeatsAsync(int id);
    Task<Dictionary<int, int>> GetBookedSeatsCountsAsync(IEnumerable<int> scheduleIds);
    Task<bool> HasGuideConflictAsync(int guideUserId, DateOnly startDate, DateOnly endDate, int? excludeScheduleId = null);
    void Add(TourSchedule schedule);
    void Remove(TourSchedule schedule);
    Task SaveChangesAsync();
}
