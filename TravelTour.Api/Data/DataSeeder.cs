using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Models;
using TravelTour.Api.Services;

namespace TravelTour.Api.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwordService = scope.ServiceProvider.GetRequiredService<PasswordService>();

        await db.Database.MigrateAsync();
        await SeedAdminUserAsync(db, passwordService);
    }

    private static async Task SeedAdminUserAsync(AppDbContext db, PasswordService passwordService)
    {
        var admin = await db.Users.FirstOrDefaultAsync(user => user.Username == "admin");
        if (admin is not null)
        {
            if (admin.Role != "Admin")
            {
                admin.Role = "Admin";
                await db.SaveChangesAsync();
            }

            return;
        }

        db.Users.Add(new User
        {
            Username = "admin",
            PasswordHash = passwordService.Hash("admin123"),
            FullName = "Quản Trị Viên",
            Role = "Admin"
        });

        await db.SaveChangesAsync();
    }
}
