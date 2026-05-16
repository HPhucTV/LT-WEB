using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelTour.Api.Services;

namespace TravelTour.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/reports")]
public class ReportsController(ReportService reportService) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        return Ok(await reportService.SummaryAsync());
    }

    [HttpGet("revenue")]
    public async Task<IActionResult> Revenue([FromQuery] string? from, [FromQuery] string? to)
    {
        return Ok(await reportService.RevenueAsync(from, to));
    }

    [HttpGet("export/bookings")]
    public async Task<IActionResult> ExportBookings([FromQuery] string? from, [FromQuery] string? to)
    {
        return CsvFile(await reportService.ExportBookingsAsync(from, to));
    }

    [HttpGet("export/revenue")]
    public async Task<IActionResult> ExportRevenue([FromQuery] string? from, [FromQuery] string? to)
    {
        return CsvFile(await reportService.ExportRevenueAsync(from, to));
    }

    private FileContentResult CsvFile(ReportExportResult report)
    {
        return File(report.Bytes, "text/csv; charset=utf-8", report.FileName);
    }
}
