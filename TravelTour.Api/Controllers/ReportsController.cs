using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Data;

namespace TravelTour.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/reports")]
public class ReportsController(AppDbContext db) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var totalTours = await db.Tours.CountAsync();
        var activeTours = await db.Tours.CountAsync(t => t.IsActive);
        var totalBookings = await db.Bookings.CountAsync();
        var totalCustomers = await db.Customers.CountAsync();

        // Aggregate directly on DB instead of loading all records into memory
        var confirmedQuery = db.Bookings.Where(b => b.Status != "Cancelled");
        var totalRevenue = await confirmedQuery.SumAsync(b => b.TotalAmount);
        var totalGuests = await confirmedQuery.SumAsync(b => b.GuestCount);

        var topTours = await db.Bookings
            .Where(b => b.Status != "Cancelled")
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

        return Ok(new
        {
            totalTours,
            activeTours,
            totalBookings,
            totalCustomers,
            totalRevenue,
            totalGuests,
            topTours
        });
    }

    [HttpGet("revenue")]
    public async Task<IActionResult> Revenue([FromQuery] string? from, [FromQuery] string? to)
    {
        var query = db.Bookings
            .Where(b => b.Status != "Cancelled")
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

        var totalRevenue = data.Sum(b => b.TotalAmount);

        return Ok(new { totalRevenue, items = data });
    }

    [HttpGet("export/bookings")]
    public async Task<IActionResult> ExportBookings([FromQuery] string? from, [FromQuery] string? to)
    {
        var query = db.Bookings
            .Include(b => b.TourSchedule!)
                .ThenInclude(s => s.Tour)
            .AsQueryable();

        query = ApplyDateFilter(query, from, to);

        var bookings = await query.OrderByDescending(b => b.CreatedAt).ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("ID,Tour,Khach hang,SDT,So khach,Tong tien,Trang thai,Ngay tao");

        foreach (var b in bookings)
        {
            csv.AppendLine(
                $"{b.Id},\"{b.TourSchedule?.Tour?.Name}\",\"{b.CustomerName}\"," +
                $"{b.CustomerPhone},{b.GuestCount},{b.TotalAmount},{b.Status}," +
                $"{b.CreatedAt:yyyy-MM-dd HH:mm}");
        }

        return CsvFile(csv, "bookings.csv");
    }

    [HttpGet("export/revenue")]
    public async Task<IActionResult> ExportRevenue([FromQuery] string? from, [FromQuery] string? to)
    {
        var query = db.Bookings
            .Where(b => b.Status != "Cancelled")
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
        csv.AppendLine("Tour,So booking,Tong khach,Doanh thu");

        foreach (var row in data)
            csv.AppendLine($"\"{row.TourName}\",{row.BookingCount},{row.TotalGuests},{row.Revenue}");

        return CsvFile(csv, "revenue.csv");
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private static IQueryable<Models.Booking> ApplyDateFilter(
        IQueryable<Models.Booking> query, string? from, string? to)
    {
        if (DateOnly.TryParse(from, out var fromDate))
            query = query.Where(b => b.CreatedAt >= fromDate.ToDateTime(TimeOnly.MinValue));

        if (DateOnly.TryParse(to, out var toDate))
            query = query.Where(b => b.CreatedAt <= toDate.ToDateTime(TimeOnly.MaxValue));

        return query;
    }

    private FileContentResult CsvFile(StringBuilder csv, string filename)
    {
        var bytes = Encoding.UTF8.GetPreamble()
            .Concat(Encoding.UTF8.GetBytes(csv.ToString()))
            .ToArray();
        return File(bytes, "text/csv; charset=utf-8", filename);
    }
}
