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
            .Include(booking => booking.PrivateGroupBookingDetails)
            .Include(booking => booking.PrivateGroupContract)
            .Include(booking => booking.Passengers)
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
                    .ThenInclude(schedule => schedule.Tour)
                .Include(booking => booking.PrivateGroupBookingDetails)
                .Include(booking => booking.PrivateGroupContract)
                .Include(booking => booking.Passengers);
        }
        else
        {
            query = query
                .Include(booking => booking.TourSchedule)
                .Include(booking => booking.PrivateGroupBookingDetails)
                .Include(booking => booking.PrivateGroupContract)
                .Include(booking => booking.Passengers);
        }

        return await query.FirstOrDefaultAsync(booking => booking.Id == id);
    }

    public async Task<Booking?> GetByTransactionRefAsync(string transactionRef)
    {
        return await db.Bookings
            .Include(booking => booking.TourSchedule!)
                .ThenInclude(schedule => schedule.Tour)
            .Include(booking => booking.PrivateGroupBookingDetails)
            .Include(booking => booking.PrivateGroupContract)
            .Include(booking => booking.Passengers)
            .FirstOrDefaultAsync(booking =>
                booking.MomoOrderId == transactionRef
                || booking.PrivateGroupContract!.DepositTransactionRef == transactionRef
                || booking.PrivateGroupContract!.RemainingTransactionRef == transactionRef);
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
