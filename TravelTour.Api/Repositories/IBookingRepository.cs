using TravelTour.Api.Models;

namespace TravelTour.Api.Repositories;

public interface IBookingRepository
{
    Task<List<Booking>> GetAllAsync();
    Task<Booking?> GetByIdAsync(int id, bool includeTour = false);
    Task<Booking?> GetByTransactionRefAsync(string transactionRef);
    void Add(Booking booking);
    void Remove(Booking booking);
    Task SaveChangesAsync();
}
