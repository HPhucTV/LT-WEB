namespace TravelTour.Api.Contracts;

public record CustomerRequest(
    string FullName,
    string Phone,
    string Email,
    string Address);

public record CustomerResponse(
    int Id,
    string FullName,
    string Phone,
    string Email,
    string Address,
    DateTime CreatedAt);
