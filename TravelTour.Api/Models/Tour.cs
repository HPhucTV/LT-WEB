namespace TravelTour.Api.Models;

public class Tour
{
    public int Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Destination { get; set; } = string.Empty;

    public int DurationDays { get; set; }

    public decimal Price { get; set; }

    public decimal OriginalPrice { get; set; }

    public int MaxGuests { get; set; }

    public string Category { get; set; } = "Khám phá";

    public string Description { get; set; } = string.Empty;

    public string ImageUrl { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public List<TourSchedule> Schedules { get; set; } = [];
}
