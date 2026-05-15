namespace TravelTour.Api.Contracts;

public record GuideAvailabilityRequest(
    DateOnly StartDate,
    DateOnly EndDate,
    string? Note);

public record GuideAvailabilityResponse(
    int Id,
    int GuideUserId,
    string GuideName,
    DateOnly StartDate,
    DateOnly EndDate,
    string Status,
    string? Note,
    DateTime CreatedAt);

public record AvailableGuideResponse(
    int Id,
    string Username,
    string FullName,
    string AvailabilityNote);
