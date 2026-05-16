using TravelTour.Api.Models;

namespace TravelTour.Api.Repositories;

public interface ITourRepository
{
    Task<List<Tour>> GetAllAsync();
    Task<Tour?> GetByIdAsync(int id, bool asNoTracking = false);
    Task<bool> ExistsAsync(int id);
    Task<bool> HasSchedulesAsync(int id);
    void Add(Tour tour);
    void Remove(Tour tour);
    Task SaveChangesAsync();
}
