using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Models;

namespace TravelTour.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Tour> Tours => Set<Tour>();
    public DbSet<TourSchedule> TourSchedules => Set<TourSchedule>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<GuideAvailability> GuideAvailabilities => Set<GuideAvailability>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tour>(entity =>
        {
            entity.Property(t => t.Code).HasMaxLength(20);
            entity.Property(t => t.Name).HasMaxLength(160);
            entity.Property(t => t.Destination).HasMaxLength(120);
            entity.Property(t => t.Price).HasColumnType("decimal(18,2)");
            entity.Property(t => t.OriginalPrice).HasColumnType("decimal(18,2)");
            entity.Property(t => t.PromotionTitle).HasMaxLength(120);
            entity.Property(t => t.PromotionDescription).HasMaxLength(500);
            entity.Property(t => t.Category).HasMaxLength(60);
            entity.HasIndex(t => t.Code).IsUnique();
        });

        modelBuilder.Entity<TourSchedule>(entity =>
        {
            entity.Property(s => s.Status).HasMaxLength(40);
            entity.Property(s => s.GuideName).HasMaxLength(120);
            entity.Property(s => s.Note).HasMaxLength(500);
            entity.HasIndex(s => s.TourId);
            entity.HasIndex(s => s.GuideUserId);
            entity.HasOne(s => s.GuideUser)
                .WithMany()
                .HasForeignKey(s => s.GuideUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.Property(b => b.CustomerName).HasMaxLength(120);
            entity.Property(b => b.CustomerPhone).HasMaxLength(30);
            entity.Property(b => b.CustomerEmail).HasMaxLength(120).HasDefaultValue("");
            entity.Property(b => b.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(b => b.BookingType).HasMaxLength(30).HasDefaultValue("Shared");
            entity.Property(b => b.Status).HasMaxLength(40);
            entity.Property(b => b.PaymentMethod).HasMaxLength(30);
            entity.Property(b => b.PaymentStatus).HasMaxLength(40);
            entity.Property(b => b.MomoOrderId).HasMaxLength(80);
            entity.Property(b => b.MomoRequestId).HasMaxLength(80);
            entity.Property(b => b.MomoTransactionId).HasMaxLength(80);

            // Performance indexes for commonly queried columns
            entity.HasIndex(b => b.TourScheduleId);
            entity.HasIndex(b => b.Status);
            entity.HasIndex(b => b.CreatedAt);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(u => u.Username).HasMaxLength(80);
            entity.Property(u => u.FullName).HasMaxLength(120);
            entity.Property(u => u.Role).HasMaxLength(20);
            entity.HasIndex(u => u.Username).IsUnique();
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.Property(c => c.FullName).HasMaxLength(120);
            entity.Property(c => c.Phone).HasMaxLength(30);
            entity.Property(c => c.Email).HasMaxLength(120);
            entity.Property(c => c.Address).HasMaxLength(200);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.Property(r => r.CustomerName).HasMaxLength(120);
            entity.Property(r => r.Comment).HasMaxLength(1000);
            entity.HasIndex(r => r.TourId);
        });

        modelBuilder.Entity<GuideAvailability>(entity =>
        {
            entity.Property(a => a.Status).HasMaxLength(40);
            entity.Property(a => a.Note).HasMaxLength(500);
            entity.HasIndex(a => a.GuideUserId);
            entity.HasIndex(a => new { a.StartDate, a.EndDate });
            entity.HasOne(a => a.GuideUser)
                .WithMany()
                .HasForeignKey(a => a.GuideUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

    }
}
