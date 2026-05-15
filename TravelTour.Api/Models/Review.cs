namespace TravelTour.Api.Models;

public class Review
{
    public int Id { get; set; }

    public int TourId { get; set; }

    public Tour? Tour { get; set; }

    public string CustomerName { get; set; } = string.Empty;

    public int Rating { get; set; }

    public string Comment { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
