namespace TravelTour.Api.Models;

public class GuideAvailability
{
    public int Id { get; set; }

    public int GuideUserId { get; set; }

    public User? GuideUser { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public string Status { get; set; } = "Available";

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
