using TravelTour.Api.Contracts;
using TravelTour.Api.Models;
using TravelTour.Api.Repositories;

namespace TravelTour.Api.Services;

public class ScheduleService(IScheduleRepository schedules, IUserRepository users)
{
    public async Task<List<ScheduleResponse>> GetAllAsync(int? tourId, string? status)
    {
        var schedulesList = await schedules.GetAllAsync(tourId, status);
        var scheduleIds = schedulesList.Select(s => s.Id).ToList();
        var counts = await schedules.GetBookedSeatsCountsAsync(scheduleIds);

        return schedulesList.Select(s => ToResponse(s, counts.GetValueOrDefault(s.Id, 0))).ToList();
    }

    public async Task<ServiceResult<ScheduleResponse>> UpdateAsync(int id, ScheduleRequest request)
    {
        var schedule = await schedules.GetByIdAsync(id, includeTour: true);
        if (schedule is null)
        {
            return ServiceResult<ScheduleResponse>.NotFound();
        }

        var error = Validate(request);
        if (error is not null)
        {
            return ServiceResult<ScheduleResponse>.BadRequest(error);
        }

        var guide = await users.GetGuideByIdAsync(request.GuideUserId);
        if (request.GuideUserId is not null && guide is null)
        {
            return ServiceResult<ScheduleResponse>.BadRequest("Hướng dẫn viên không hợp lệ.");
        }

        if (guide is not null && await schedules.HasGuideConflictAsync(guide.Id, request.StartDate, request.EndDate, schedule.Id))
        {
            return ServiceResult<ScheduleResponse>.BadRequest("Hướng dẫn viên đã có tour trong khoảng thời gian này.");
        }

        schedule.StartDate = request.StartDate;
        schedule.EndDate = request.EndDate;
        schedule.AvailableSeats = request.AvailableSeats;
        schedule.Status = request.Status.Trim();
        schedule.GuideUserId = guide?.Id;
        schedule.GuideName = guide?.FullName ?? (string.IsNullOrWhiteSpace(request.GuideName) ? null : request.GuideName.Trim());
        schedule.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        await schedules.SaveChangesAsync();

        var bookedSeats = await schedules.CountBookedSeatsAsync(schedule.Id);
        return ServiceResult<ScheduleResponse>.Success(ToResponse(schedule, bookedSeats));
    }

    public async Task<ServiceResult<ScheduleResponse>> AssignGuideAsync(int id, AssignGuideRequest request)
    {
        var schedule = await schedules.GetByIdAsync(id, includeTour: true);
        if (schedule is null)
        {
            return ServiceResult<ScheduleResponse>.NotFound();
        }

        var guide = await users.GetGuideByIdAsync(request.GuideUserId);
        if (request.GuideUserId is not null && guide is null)
        {
            return ServiceResult<ScheduleResponse>.BadRequest("Hướng dẫn viên không hợp lệ.");
        }

        if (guide is not null && await schedules.HasGuideConflictAsync(guide.Id, schedule.StartDate, schedule.EndDate, schedule.Id))
        {
            return ServiceResult<ScheduleResponse>.BadRequest("Hướng dẫn viên đã có tour trong khoảng thời gian này.");
        }

        schedule.GuideUserId = guide?.Id;
        schedule.GuideName = guide?.FullName;

        await schedules.SaveChangesAsync();

        var bookedSeats = await schedules.CountBookedSeatsAsync(schedule.Id);
        return ServiceResult<ScheduleResponse>.Success(ToResponse(schedule, bookedSeats));
    }

    public async Task<ServiceResult> DeleteAsync(int id)
    {
        var schedule = await schedules.GetByIdAsync(id);
        if (schedule is null)
        {
            return ServiceResult.NotFound();
        }

        if (await schedules.HasBookingsAsync(id))
        {
            return ServiceResult.BadRequest("Không thể xoá lịch đang có đặt tour. Hãy xoá đặt tour trước.");
        }

        schedules.Remove(schedule);
        await schedules.SaveChangesAsync();
        return ServiceResult.Success();
    }

    private static ScheduleResponse ToResponse(TourSchedule schedule, int bookedSeats)
    {
        return new ScheduleResponse(
            schedule.Id,
            schedule.TourId,
            schedule.Tour!.Name,
            schedule.StartDate,
            schedule.EndDate,
            schedule.AvailableSeats,
            schedule.Status,
            schedule.ScheduleType,
            schedule.GuideUserId,
            schedule.GuideName,
            schedule.Note,
            bookedSeats);
    }

    private static string? Validate(ScheduleRequest request)
    {
        if (request.EndDate < request.StartDate) return "Ngày kết thúc phải sau ngày bắt đầu.";
        if (request.AvailableSeats <= 0) return "Số chỗ phải lớn hơn 0.";
        if (string.IsNullOrWhiteSpace(request.Status)) return "Trạng thái không được để trống.";
        return null;
    }
}
