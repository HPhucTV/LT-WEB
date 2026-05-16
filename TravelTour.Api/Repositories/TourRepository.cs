using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Data;
using TravelTour.Api.Models;

namespace TravelTour.Api.Repositories;

public class TourRepository(AppDbContext db) : ITourRepository
{
    public async Task<List<Tour>> GetAllAsync()
    {
        return await db.Tours
            .AsNoTracking()
            .OrderBy(tour => tour.Name)
            .ToListAsync();
    }

    public async Task<Tour?> GetByIdAsync(int id, bool asNoTracking = false)
    {
        var query = db.Tours.AsQueryable();
        if (asNoTracking)
        {
            query = query.AsNoTracking();
        }

        return await query.FirstOrDefaultAsync(tour => tour.Id == id);
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await db.Tours.AnyAsync(tour => tour.Id == id);
    }

    public async Task<bool> HasSchedulesAsync(int id)
    {
        return await db.TourSchedules.AnyAsync(schedule => schedule.TourId == id);
    }

    public void Add(Tour tour)
    {
        db.Tours.Add(tour);
    }

    public void Remove(Tour tour)
    {
        db.Tours.Remove(tour);
    }

    public Task SaveChangesAsync()
    {
        return db.SaveChangesAsync();
    }
}
