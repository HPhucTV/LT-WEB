namespace TravelTour.Api.Models;

public class TourSchedule
{
    public int Id { get; set; }

    public int TourId { get; set; }

    public Tour? Tour { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public int AvailableSeats { get; set; }

    public string Status { get; set; } = "Open";

    public string ScheduleType { get; set; } = "Shared";

    public int? GuideUserId { get; set; }

    public User? GuideUser { get; set; }

    public string? GuideName { get; set; }

    public string? Note { get; set; }
}
