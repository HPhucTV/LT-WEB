namespace TravelTour.Api.Contracts;

public record LoginRequest(string Username, string Password);

public record RegisterRequest(string Username, string Password, string FullName, string? Role = null);

public record AuthResponse(string Token, string Username, string FullName, string Role);
