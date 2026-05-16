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

        await SeedUsersAsync(db, passwordService);
        await SeedToursAsync(db);
        await SeedCustomersAsync(db);
        await SeedSchedulesAsync(db);
        await SeedReviewsAsync(db);
        await SeedGuideAvailabilitiesAsync(db);
    }

    private static async Task SeedUsersAsync(AppDbContext db, PasswordService passwordService)
    {
        var users = new[]
        {
            new User { Username = "admin", PasswordHash = passwordService.Hash("admin123"), FullName = "Quan Tri Vien", Role = "Admin" },
            new User { Username = "staff", PasswordHash = passwordService.Hash("staff123"), FullName = "Nhan Vien Tu Van", Role = "Staff" },
            new User { Username = "customer1", PasswordHash = passwordService.Hash("1234"), FullName = "Nguyen Van An", Role = "Customer" },
            new User { Username = "customer2", PasswordHash = passwordService.Hash("1234"), FullName = "Tran Thi Bich", Role = "Customer" },
        };

        foreach (var user in users)
        {
            if (!await db.Users.AnyAsync(item => item.Username == user.Username))
            {
                db.Users.Add(user);
            }
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedToursAsync(AppDbContext db)
    {
        if (await db.Tours.AnyAsync()) return;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        db.Tours.AddRange(
            new Tour
            {
                Code = "PQ-001",
                Name = "Kham Pha Dao Ngoc Phu Quoc",
                Destination = "Phu Quoc",
                DurationDays = 3,
                Price = 3500000,
                OriginalPrice = 4200000,
                PromotionTitle = "Uu dai bien dao",
                PromotionDescription = "Giam gia cho nhom dat som.",
                DiscountStartDate = today,
                DiscountEndDate = today.AddDays(30),
                MaxGuests = 30,
                Category = "Nghi duong",
                Description = "Chuyen di nghi duong tai hon dao xinh dep voi bien xanh, cat trang va hai san tuoi.",
                ImageUrl = "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80",
                IsActive = true
            },
            new Tour
            {
                Code = "DL-002",
                Name = "Thanh Pho Ngan Hoa Da Lat",
                Destination = "Da Lat",
                DurationDays = 4,
                Price = 2800000,
                OriginalPrice = 3500000,
                PromotionTitle = "Deal trong tuan",
                PromotionDescription = "Ap dung cho khach dat tour Da Lat trong tuan nay.",
                DiscountStartDate = today,
                DiscountEndDate = today.AddDays(14),
                MaxGuests = 25,
                Category = "Kham pha",
                Description = "Tan huong khong khi se lanh, vuon hoa, thac nuoc va ca phe cao nguyen.",
                ImageUrl = "https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?w=800&q=80",
                IsActive = true
            },
            new Tour
            {
                Code = "HL-003",
                Name = "Di San Vinh Ha Long",
                Destination = "Ha Long",
                DurationDays = 2,
                Price = 4200000,
                OriginalPrice = 4200000,
                MaxGuests = 40,
                Category = "Kham pha",
                Description = "Nghi duong tren du thuyen, tham quan hang dong va cheo kayak giua vinh.",
                ImageUrl = "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
                IsActive = true
            },
            new Tour
            {
                Code = "DN-004",
                Name = "Da Nang - Hoi An Co Kinh",
                Destination = "Da Nang",
                DurationDays = 4,
                Price = 5100000,
                OriginalPrice = 6500000,
                PromotionTitle = "Combo gia dinh",
                PromotionDescription = "Uu dai cho nhom gia dinh tu 3 khach.",
                DiscountStartDate = today,
                DiscountEndDate = today.AddDays(21),
                MaxGuests = 35,
                Category = "Gia dinh",
                Description = "Kham pha Ba Na Hills, cau Vang, pho co Hoi An va bien My Khe.",
                ImageUrl = "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80",
                IsActive = true
            });

        await db.SaveChangesAsync();
    }

    private static async Task SeedCustomersAsync(AppDbContext db)
    {
        if (await db.Customers.AnyAsync()) return;

        db.Customers.AddRange(
            new Customer { FullName = "Nguyen Van An", Phone = "0901234567", Email = "nguyenvanan@gmail.com", Address = "Quan 1, TP.HCM" },
            new Customer { FullName = "Tran Thi Bich", Phone = "0912345678", Email = "tranthib@gmail.com", Address = "Quan 3, TP.HCM" },
            new Customer { FullName = "Le Minh Chau", Phone = "0923456789", Email = "leminhchau@gmail.com", Address = "Quan 7, TP.HCM" });

        await db.SaveChangesAsync();
    }

    private static async Task SeedSchedulesAsync(AppDbContext db)
    {
        if (await db.TourSchedules.AnyAsync()) return;

        var tours = await db.Tours.OrderBy(tour => tour.Id).Take(4).ToListAsync();
        if (tours.Count == 0) return;

        var guide = await db.Users.FirstOrDefaultAsync(user => user.Username == "staff");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        for (var i = 0; i < tours.Count; i++)
        {
            var startDate = today.AddDays(7 + (i * 5));
            db.TourSchedules.Add(new TourSchedule
            {
                TourId = tours[i].Id,
                StartDate = startDate,
                EndDate = startDate.AddDays(tours[i].DurationDays - 1),
                AvailableSeats = Math.Max(10, tours[i].MaxGuests - 5),
                Status = "Open",
                GuideUserId = guide?.Id,
                GuideName = guide?.FullName,
                Note = "Lich khoi hanh mau"
            });
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedReviewsAsync(AppDbContext db)
    {
        if (await db.Reviews.AnyAsync()) return;

        var firstTour = await db.Tours.OrderBy(tour => tour.Id).FirstOrDefaultAsync();
        if (firstTour is null) return;

        db.Reviews.AddRange(
            new Review { TourId = firstTour.Id, CustomerName = "Nguyen Van An", Rating = 5, Comment = "Tour rat dang tien, lich trinh hop ly va dich vu tot." },
            new Review { TourId = firstTour.Id, CustomerName = "Tran Thi Bich", Rating = 4, Comment = "Huong dan vien nhiet tinh, gia ca phu hop." });

        await db.SaveChangesAsync();
    }

    private static async Task SeedGuideAvailabilitiesAsync(AppDbContext db)
    {
        if (await db.GuideAvailabilities.AnyAsync()) return;

        var guide = await db.Users.FirstOrDefaultAsync(user => user.Username == "staff");
        if (guide is null) return;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        db.GuideAvailabilities.Add(new GuideAvailability
        {
            GuideUserId = guide.Id,
            StartDate = today.AddDays(1),
            EndDate = today.AddDays(60),
            Status = "Available",
            Note = "San sang nhan lich tour"
        });

        await db.SaveChangesAsync();
    }
}
