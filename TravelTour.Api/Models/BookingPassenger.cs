namespace TravelTour.Api.Models;

public class BookingPassenger
{
    public int Id { get; set; }

    public int BookingId { get; set; }

    public Booking? Booking { get; set; }

    public string FullName { get; set; } = string.Empty;

    public DateOnly DateOfBirth { get; set; }

    public string PassengerType { get; set; } = "Adult";

    public string? IdentityNumber { get; set; }

    public string Phone { get; set; } = string.Empty;
}
