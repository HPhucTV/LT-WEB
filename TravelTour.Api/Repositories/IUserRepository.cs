using TravelTour.Api.Models;

namespace TravelTour.Api.Repositories;

public interface IUserRepository
{
    Task<User?> GetGuideByIdAsync(int? id);
}
