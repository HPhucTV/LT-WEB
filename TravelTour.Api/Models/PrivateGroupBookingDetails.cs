namespace TravelTour.Api.Models;

public class PrivateGroupBookingDetails
{
    public int BookingId { get; set; }

    public Booking? Booking { get; set; }

    public string? RequestNote { get; set; }

    public int AdultCount { get; set; }

    public int ChildCount { get; set; }

    public decimal EstimatedAmount { get; set; }
}
