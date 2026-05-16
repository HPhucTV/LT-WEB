using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Data;
using TravelTour.Api.Models;

namespace TravelTour.Api.Repositories;

public class BookingRepository(AppDbContext db) : IBookingRepository
{
    public async Task<List<Booking>> GetAllAsync()
    {
        return await db.Bookings
            .AsNoTracking()
            .Include(booking => booking.TourSchedule!)
                .ThenInclude(schedule => schedule.Tour)
            .OrderByDescending(booking => booking.CreatedAt)
            .ToListAsync();
    }

    public async Task<Booking?> GetByIdAsync(int id, bool includeTour = false)
    {
        var query = db.Bookings.AsQueryable();
        if (includeTour)
        {
            query = query
                .Include(booking => booking.TourSchedule!)
                    .ThenInclude(schedule => schedule.Tour);
        }
        else
        {
            query = query.Include(booking => booking.TourSchedule);
        }

        return await query.FirstOrDefaultAsync(booking => booking.Id == id);
    }

    public void Add(Booking booking)
    {
        db.Bookings.Add(booking);
    }

    public void Remove(Booking booking)
    {
        db.Bookings.Remove(booking);
    }

    public Task SaveChangesAsync()
    {
        return db.SaveChangesAsync();
    }
}
