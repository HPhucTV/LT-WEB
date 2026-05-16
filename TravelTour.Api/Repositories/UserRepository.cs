using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Data;
using TravelTour.Api.Models;

namespace TravelTour.Api.Repositories;

public class UserRepository(AppDbContext db) : IUserRepository
{
    public async Task<User?> GetGuideByIdAsync(int? id)
    {
        if (id is null)
        {
            return null;
        }

        return await db.Users.FirstOrDefaultAsync(user => user.Id == id && user.Role == "Staff");
    }
}
