namespace TravelTour.Api.Contracts;

public record LoginRequest(string Username, string Password);

public record RegisterRequest(
    string Username,
    string Password,
    string FullName,
    string? Role = null,
    string? Email = null,
    string? Phone = null,
    string? Address = null
);

public record AuthResponse(string Token, string Username, string FullName, string Role);
