namespace TravelTour.Api.Models;

public class TourFavorite
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User User { get; set; } = null!;

    public int TourId { get; set; }

    public Tour Tour { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
