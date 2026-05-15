namespace TravelTour.Api.Contracts;

public record ScheduleRequest(
    DateOnly StartDate,
    DateOnly EndDate,
    int AvailableSeats,
    string Status,
    int? GuideUserId,
    string? GuideName,
    string? Note);

public record ScheduleResponse(
    int Id,
    int TourId,
    string TourName,
    DateOnly StartDate,
    DateOnly EndDate,
    int AvailableSeats,
    string Status,
    int? GuideUserId,
    string? GuideName,
    string? Note,
    int BookedSeats);

public record AssignGuideRequest(int? GuideUserId);
