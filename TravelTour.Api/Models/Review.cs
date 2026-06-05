namespace TravelTour.Api.Models;

public class Review
{
    public int Id { get; set; }

    public int TourId { get; set; }

    public Tour? Tour { get; set; }

    /// <summary>
    /// FK tới User — dùng để kiểm tra quyền sở hữu (thay thế so sánh FullName).
    /// Nullable để tương thích ngược với các review cũ chưa có UserId.
    /// </summary>
    public int? UserId { get; set; }

    public User? User { get; set; }

    public string CustomerName { get; set; } = string.Empty;

    public int Rating { get; set; }

    public string Comment { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
