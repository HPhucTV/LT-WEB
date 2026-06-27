using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Controllers;
using TravelTour.Api.Data;

namespace TravelTour.Api.Services;

public class UserManagementService(AppDbContext db)
{
    private static readonly string[] AllowedRoles = ["Admin", "Sales", "Staff", "Customer"];

    public async Task<List<object>> GetAllAsync()
    {
        var users = await db.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new { u.Id, u.Username, u.FullName, u.Role, u.CreatedAt })
            .ToListAsync();

        return users.Cast<object>().ToList();
    }

    public async Task<ServiceResult<object>> UpdateRoleAsync(int id, UpdateRoleRequest request)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return ServiceResult<object>.NotFound();

        if (!AllowedRoles.Contains(request.Role))
        {
            return ServiceResult<object>.BadRequest("Role không hợp lệ.");
        }

        user.Role = request.Role;
        await db.SaveChangesAsync();

        return ServiceResult<object>.Success(new { user.Id, user.Username, user.FullName, user.Role, user.CreatedAt });
    }

    public async Task<List<object>> GetSalesAsync()
    {
        var users = await db.Users
            .AsNoTracking()
            .Where(u => u.Role == "Sales")
            .OrderBy(u => u.FullName)
            .Select(u => new { u.Id, u.Username, u.FullName, u.Role, u.CreatedAt })
            .ToListAsync();

        return users.Cast<object>().ToList();
    }

    public async Task<ServiceResult> DeleteAsync(int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return ServiceResult.NotFound();

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return ServiceResult.Success();
    }
}
