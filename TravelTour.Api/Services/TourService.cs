using TravelTour.Api.Contracts;
using TravelTour.Api.Models;
using TravelTour.Api.Repositories;

namespace TravelTour.Api.Services;

public class TourService(
    ITourRepository tours,
    IScheduleRepository schedules,
    IUserRepository users,
    CacheService cache)
{
    private const string CacheKey = "tours:all";

    public async Task<List<TourResponse>> GetAllAsync()
    {
        var cached = await cache.GetAsync<List<TourResponse>>(CacheKey);
        if (cached is not null)
        {
            return cached;
        }

        var result = (await tours.GetAllAsync()).Select(ToResponse).ToList();
        await cache.SetAsync(CacheKey, result);
        return result;
    }

    public async Task<ServiceResult<TourResponse>> GetByIdAsync(int id)
    {
        var tour = await tours.GetByIdAsync(id, asNoTracking: true);
        return tour is null
            ? ServiceResult<TourResponse>.NotFound()
            : ServiceResult<TourResponse>.Success(ToResponse(tour));
    }

    public async Task<ServiceResult<TourResponse>> CreateAsync(TourRequest request)
    {
        var error = Validate(request) ?? ValidatePromotion(request);
        if (error is not null)
        {
            return ServiceResult<TourResponse>.BadRequest(error);
        }

        if (await tours.CodeExistsAsync(request.Code))
        {
            return ServiceResult<TourResponse>.BadRequest("Mã tour đã tồn tại.");
        }

        var tour = new Tour
        {
            Code = request.Code.Trim(),
            Name = request.Name.Trim(),
            Destination = request.Destination.Trim(),
            DurationDays = request.DurationDays,
            Price = request.Price,
            OriginalPrice = request.OriginalPrice,
            PromotionTitle = request.PromotionTitle?.Trim() ?? string.Empty,
            PromotionDescription = request.PromotionDescription?.Trim() ?? string.Empty,
            DiscountStartDate = request.DiscountStartDate,
            DiscountEndDate = request.DiscountEndDate,
            MaxGuests = request.MaxGuests,
            MinGroupGuests = request.MinGroupGuests,
            Category = request.Category?.Trim() ?? "Khám phá",
            Description = request.Description.Trim(),
            ImageUrl = request.ImageUrl.Trim(),
            IsActive = request.IsActive
        };

        tours.Add(tour);
        await tours.SaveChangesAsync();
        await cache.RemoveAsync(CacheKey);

        return ServiceResult<TourResponse>.Success(ToResponse(tour));
    }

    public async Task<ServiceResult<TourResponse>> UpdateAsync(int id, TourRequest request)
    {
        var tour = await tours.GetByIdAsync(id);
        if (tour is null)
        {
            return ServiceResult<TourResponse>.NotFound();
        }

        var error = Validate(request) ?? ValidatePromotion(request);
        if (error is not null)
        {
            return ServiceResult<TourResponse>.BadRequest(error);
        }

        if (await tours.CodeExistsAsync(request.Code, id))
        {
            return ServiceResult<TourResponse>.BadRequest("Mã tour đã tồn tại.");
        }

        tour.Code = request.Code.Trim();
        tour.Name = request.Name.Trim();
        tour.Destination = request.Destination.Trim();
        tour.DurationDays = request.DurationDays;
        tour.Price = request.Price;
        tour.OriginalPrice = request.OriginalPrice;
        tour.PromotionTitle = request.PromotionTitle?.Trim() ?? string.Empty;
        tour.PromotionDescription = request.PromotionDescription?.Trim() ?? string.Empty;
        tour.DiscountStartDate = request.DiscountStartDate;
        tour.DiscountEndDate = request.DiscountEndDate;
        tour.MaxGuests = request.MaxGuests;
        tour.MinGroupGuests = request.MinGroupGuests;
        tour.Category = request.Category?.Trim() ?? "Khám phá";
        tour.Description = request.Description.Trim();
        tour.ImageUrl = request.ImageUrl.Trim();
        tour.IsActive = request.IsActive;

        await tours.SaveChangesAsync();
        await cache.RemoveAsync(CacheKey);

        return ServiceResult<TourResponse>.Success(ToResponse(tour));
    }

    public async Task<ServiceResult> DeleteAsync(int id)
    {
        var tour = await tours.GetByIdAsync(id);
        if (tour is null)
        {
            return ServiceResult.NotFound();
        }

        if (await tours.HasSchedulesAsync(id))
        {
            return ServiceResult.BadRequest("Không thể xoá tour đang có lịch khởi hành. Hãy xoá lịch trước.");
        }

        tours.Remove(tour);
        await tours.SaveChangesAsync();
        await cache.RemoveAsync(CacheKey);

        return ServiceResult.Success();
    }

    public async Task<ServiceResult<List<ScheduleResponse>>> GetSchedulesAsync(int tourId)
    {
        if (!await tours.ExistsAsync(tourId))
        {
            return ServiceResult<List<ScheduleResponse>>.NotFound();
        }

        var result = new List<ScheduleResponse>();
        foreach (var schedule in await schedules.GetByTourIdAsync(tourId))
        {
            result.Add(await ToScheduleResponseAsync(schedule));
        }

        return ServiceResult<List<ScheduleResponse>>.Success(result);
    }

    public async Task<ServiceResult<ScheduleResponse>> CreateScheduleAsync(int tourId, ScheduleRequest request)
    {
        var tour = await tours.GetByIdAsync(tourId, asNoTracking: true);
        if (tour is null)
        {
            return ServiceResult<ScheduleResponse>.NotFound();
        }

        var error = ValidateSchedule(request);
        if (error is not null)
        {
            return ServiceResult<ScheduleResponse>.BadRequest(error);
        }

        var guide = await users.GetGuideByIdAsync(request.GuideUserId);
        if (request.GuideUserId is not null && guide is null)
        {
            return ServiceResult<ScheduleResponse>.BadRequest("Hướng dẫn viên không hợp lệ.");
        }

        if (guide is not null && await schedules.HasGuideConflictAsync(guide.Id, request.StartDate, request.EndDate))
        {
            return ServiceResult<ScheduleResponse>.BadRequest("Hướng dẫn viên đã có tour trong khoảng thời gian này.");
        }

        var schedule = new TourSchedule
        {
            TourId = tourId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            AvailableSeats = request.AvailableSeats,
            Status = request.Status.Trim(),
            ScheduleType = "Shared",
            GuideUserId = guide?.Id,
            GuideName = guide?.FullName ?? (string.IsNullOrWhiteSpace(request.GuideName) ? null : request.GuideName.Trim()),
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        };

        schedules.Add(schedule);
        await schedules.SaveChangesAsync();

        return ServiceResult<ScheduleResponse>.Success(new ScheduleResponse(
            schedule.Id, schedule.TourId, tour.Name, schedule.StartDate, schedule.EndDate,
            schedule.AvailableSeats, schedule.Status, schedule.ScheduleType, schedule.GuideUserId, schedule.GuideName,
            schedule.Note, 0));
    }

    private async Task<ScheduleResponse> ToScheduleResponseAsync(TourSchedule schedule)
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
            await schedules.CountBookedSeatsAsync(schedule.Id));
    }

    private static TourResponse ToResponse(Tour tour)
    {
        return new TourResponse(tour.Id, tour.Code, tour.Name, tour.Destination,
            tour.DurationDays, tour.Price, tour.OriginalPrice,
            tour.PromotionTitle, tour.PromotionDescription,
            tour.DiscountStartDate, tour.DiscountEndDate, tour.MaxGuests,
            tour.MinGroupGuests, tour.Category, tour.Description, tour.ImageUrl, tour.IsActive);
    }

    private static string? Validate(TourRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code)) return "Mã tour không được để trống.";
        if (string.IsNullOrWhiteSpace(request.Name)) return "Tên tour không được để trống.";
        if (request.DurationDays <= 0) return "Số ngày phải lớn hơn 0.";
        if (request.Price < 0) return "Giá tour không được âm.";
        if (request.MaxGuests <= 0) return "Số khách tối đa phải lớn hơn 0.";
        if (request.MinGroupGuests <= 0) return "Số khách tối thiểu cho đoàn phải lớn hơn 0.";
        if (request.MinGroupGuests > request.MaxGuests) return "Số khách tối thiểu cho đoàn không được vượt quá sức chứa.";
        return null;
    }

    private static string? ValidatePromotion(TourRequest request)
    {
        if (request.OriginalPrice < 0) return "Gia goc khong duoc am.";
        if (request.OriginalPrice > 0 && request.Price > request.OriginalPrice) return "Gia sau giam khong duoc lon hon gia goc.";
        if (request.DiscountStartDate is not null && request.DiscountEndDate is not null && request.DiscountEndDate < request.DiscountStartDate)
            return "Ngay ket thuc uu dai phai sau ngay bat dau.";
        return null;
    }

    private static string? ValidateSchedule(ScheduleRequest request)
    {
        if (request.EndDate < request.StartDate) return "Ngày kết thúc phải sau ngày bắt đầu.";
        if (request.AvailableSeats <= 0) return "Số chỗ phải lớn hơn 0.";
        if (string.IsNullOrWhiteSpace(request.Status)) return "Trạng thái không được để trống.";
        return null;
    }
}
