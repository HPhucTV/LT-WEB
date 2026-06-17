using System.Text;
using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Data;
using TravelTour.Api.Models;

namespace TravelTour.Api.Services;

public record ReportExportResult(byte[] Bytes, string FileName);

public class ReportService(AppDbContext db)
{
    public async Task<object> SummaryAsync()
    {
        var totalTours = await db.Tours.CountAsync();
        var activeTours = await db.Tours.CountAsync(t => t.IsActive);
        var totalBookings = await db.Bookings.CountAsync();

        var confirmedQuery = db.Bookings.Where(b => b.PaymentStatus == "Paid" && b.Status != "Cancelled");
        var totalRevenue = await confirmedQuery.SumAsync(b => b.TotalAmount);
        var totalGuests = await confirmedQuery.SumAsync(b => b.GuestCount);

        var topTours = await db.Bookings
            .Where(b => b.PaymentStatus == "Paid" && b.Status != "Cancelled")
            .Include(b => b.TourSchedule!)
                .ThenInclude(s => s.Tour)
            .GroupBy(b => b.TourSchedule!.Tour!.Name)
            .Select(g => new
            {
                TourName = g.Key,
                BookingCount = g.Count(),
                Revenue = g.Sum(b => b.TotalAmount)
            })
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToListAsync();

        return new { totalTours, activeTours, totalBookings, totalRevenue, totalGuests, topTours };
    }

    public async Task<object> RevenueAsync(string? from, string? to)
    {
        var query = db.Bookings
            .Where(b => b.PaymentStatus == "Paid" && b.Status != "Cancelled")
            .Include(b => b.TourSchedule!)
                .ThenInclude(s => s.Tour)
            .AsQueryable();

        query = ApplyDateFilter(query, from, to);

        var data = await query
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                b.Id,
                TourName = b.TourSchedule!.Tour!.Name,
                b.CustomerName,
                b.GuestCount,
                b.TotalAmount,
                b.Status,
                b.CreatedAt
            })
            .ToListAsync();

        return new { totalRevenue = data.Sum(b => b.TotalAmount), items = data };
    }

    public async Task<ReportExportResult> ExportBookingsAsync(string? from, string? to)
    {
        var query = db.Bookings
            .Include(b => b.TourSchedule!)
                .ThenInclude(s => s.Tour)
            .AsQueryable();

        query = ApplyDateFilter(query, from, to);
        var bookings = await query.OrderByDescending(b => b.CreatedAt).ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("ID,Tour,Khách hàng,SĐT,Số khách,Tổng tiền,Trạng thái,Ngày tạo");

        foreach (var b in bookings)
        {
            csv.AppendLine(
                $"{b.Id},\"{b.TourSchedule?.Tour?.Name}\",\"{b.CustomerName}\"," +
                $"{b.CustomerPhone},{b.GuestCount},{b.TotalAmount},{b.Status}," +
                $"{b.CreatedAt:yyyy-MM-dd HH:mm}");
        }

        return new ReportExportResult(ToCsvBytes(csv), "bookings.csv");
    }

    public async Task<ReportExportResult> ExportRevenueAsync(string? from, string? to)
    {
        var query = db.Bookings
            .Where(b => b.PaymentStatus == "Paid" && b.Status != "Cancelled")
            .Include(b => b.TourSchedule!)
                .ThenInclude(s => s.Tour)
            .AsQueryable();

        query = ApplyDateFilter(query, from, to);

        var data = await query
            .GroupBy(b => b.TourSchedule!.Tour!.Name)
            .Select(g => new
            {
                TourName = g.Key,
                BookingCount = g.Count(),
                TotalGuests = g.Sum(b => b.GuestCount),
                Revenue = g.Sum(b => b.TotalAmount)
            })
            .OrderByDescending(x => x.Revenue)
            .ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("Tour,Số booking,Tổng khách,Doanh thu");

        foreach (var row in data)
        {
            csv.AppendLine($"\"{row.TourName}\",{row.BookingCount},{row.TotalGuests},{row.Revenue}");
        }

        return new ReportExportResult(ToCsvBytes(csv), "revenue.csv");
    }

    private static IQueryable<Booking> ApplyDateFilter(IQueryable<Booking> query, string? from, string? to)
    {
        if (DateOnly.TryParse(from, out var fromDate))
            query = query.Where(b => b.CreatedAt >= fromDate.ToDateTime(TimeOnly.MinValue));

        if (DateOnly.TryParse(to, out var toDate))
            query = query.Where(b => b.CreatedAt <= toDate.ToDateTime(TimeOnly.MaxValue));

        return query;
    }

    private static byte[] ToCsvBytes(StringBuilder csv)
    {
        return Encoding.UTF8.GetPreamble()
            .Concat(Encoding.UTF8.GetBytes(csv.ToString()))
            .ToArray();
    }
}
