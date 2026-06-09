using TravelTour.Api.Contracts;
using TravelTour.Api.Models;
using TravelTour.Api.Repositories;

namespace TravelTour.Api.Services;

public class BookingService(
    IBookingRepository bookings,
    IScheduleRepository schedules,
    ITourRepository tours,
    IUserRepository users)
{
    private static readonly Dictionary<string, decimal> VoucherDiscounts = new(StringComparer.OrdinalIgnoreCase)
    {
        ["TRAVEX50"] = 50000m,
        ["TRAVEX100"] = 100000m,
        ["TRAVEX250"] = 250000m
    };

    public async Task<List<BookingResponse>> GetAllAsync()
    {
        return (await bookings.GetAllAsync()).Select(ToResponse).ToList();
    }

    /// <summary>
    /// Trả về danh sách booking thuộc về khách hàng đang đăng nhập,
    /// khớp theo CustomerEmail (ưu tiên), CustomerName hoặc tên đăng nhập.
    /// </summary>
    public async Task<List<BookingResponse>> GetMineAsync(string? customerEmail, string? customerName, string? username)
    {
        var all = await bookings.GetAllAsync();
        var mine = all.Where(b =>
            (!string.IsNullOrWhiteSpace(customerEmail) && b.CustomerEmail.Equals(customerEmail, StringComparison.OrdinalIgnoreCase))
            || (!string.IsNullOrWhiteSpace(customerName) && b.CustomerName.Equals(customerName, StringComparison.OrdinalIgnoreCase))
            || (!string.IsNullOrWhiteSpace(username) && b.CustomerName.Equals(username, StringComparison.OrdinalIgnoreCase)));
        return mine.Select(ToResponse).ToList();
    }

    public async Task<ServiceResult<BookingResponse>> CreateAsync(BookingRequest request)
    {
        if (!IsValidBookingType(request.BookingType))
        {
            return ServiceResult<BookingResponse>.BadRequest("Hình thức đặt tour không hợp lệ.");
        }

        var bookingType = NormalizeBookingType(request.BookingType);
        var error = Validate(request);
        if (error is not null)
        {
            return ServiceResult<BookingResponse>.BadRequest(error);
        }

        return bookingType == "PrivateGroup"
            ? await CreatePrivateGroupAsync(request)
            : await CreateSharedAsync(request);
    }

    private async Task<ServiceResult<BookingResponse>> CreateSharedAsync(BookingRequest request)
    {
        if (request.TourScheduleId is null)
        {
            return ServiceResult<BookingResponse>.BadRequest("Vui lòng chọn lịch khởi hành.");
        }

        var schedule = await schedules.GetByIdAsync(request.TourScheduleId.Value, includeTour: true);
        if (schedule is null)
        {
            return ServiceResult<BookingResponse>.BadRequest("Lịch khởi hành không tồn tại.");
        }

        if (schedule.ScheduleType != "Shared")
        {
            return ServiceResult<BookingResponse>.BadRequest("Lịch này không dành cho tour ghép.");
        }

        if (schedule.Status != "Open")
        {
            return ServiceResult<BookingResponse>.BadRequest("Lịch khởi hành này đã đóng, không thể đặt tour.");
        }

        if (request.GuestCount > schedule.AvailableSeats)
        {
            return ServiceResult<BookingResponse>.BadRequest($"Chỉ còn {schedule.AvailableSeats} chỗ trống.");
        }

        var voucher = GetVoucherDiscount(request.VoucherCode, schedule.Tour!.Price * request.GuestCount);
        if (voucher.Error is not null)
        {
            return ServiceResult<BookingResponse>.BadRequest(voucher.Error);
        }

        var grossAmount = schedule.Tour.Price * request.GuestCount;
        var booking = new Booking
        {
            TourScheduleId = schedule.Id,
            TourSchedule = schedule,
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            CustomerEmail = request.CustomerEmail.Trim(),
            GuestCount = request.GuestCount,
            BookingType = "Shared",
            VoucherCode = voucher.Code,
            VoucherDiscountAmount = voucher.DiscountAmount,
            TotalAmount = Math.Max(0, grossAmount - voucher.DiscountAmount),
            Status = "Pending"
        };

        schedule.AvailableSeats -= request.GuestCount;
        bookings.Add(booking);
        await bookings.SaveChangesAsync();

        return ServiceResult<BookingResponse>.Success(ToResponse(booking));
    }

    private async Task<ServiceResult<BookingResponse>> CreatePrivateGroupAsync(BookingRequest request)
    {
        if (request.TourId is null)
        {
            return ServiceResult<BookingResponse>.BadRequest("Vui lòng chọn tour.");
        }

        if (request.RequestedStartDate is null)
        {
            return ServiceResult<BookingResponse>.BadRequest("Vui lòng chọn ngày khởi hành mong muốn.");
        }

        var tour = await tours.GetByIdAsync(request.TourId.Value);
        if (tour is null)
        {
            return ServiceResult<BookingResponse>.BadRequest("Tour không tồn tại.");
        }

        if (!tour.IsActive)
        {
            return ServiceResult<BookingResponse>.BadRequest("Tour này đang đóng, không thể đặt đoàn.");
        }

        if (request.RequestedStartDate.Value < DateOnly.FromDateTime(DateTime.Today))
        {
            return ServiceResult<BookingResponse>.BadRequest("Ngày khởi hành không được ở trong quá khứ.");
        }

        if (request.GuestCount < tour.MinGroupGuests)
        {
            return ServiceResult<BookingResponse>.BadRequest(
                $"Đi theo đoàn cần ít nhất {tour.MinGroupGuests} khách cho tour này.");
        }

        if (request.GuestCount > tour.MaxGuests)
        {
            return ServiceResult<BookingResponse>.BadRequest(
                $"Tour này chỉ nhận tối đa {tour.MaxGuests} khách cho một đoàn.");
        }

        var startDate = request.RequestedStartDate.Value;
        var schedule = new TourSchedule
        {
            TourId = tour.Id,
            Tour = tour,
            StartDate = startDate,
            EndDate = startDate.AddDays(tour.DurationDays - 1),
            AvailableSeats = request.GuestCount,
            Status = "Pending",
            ScheduleType = "PrivateGroup",
            Note = $"Yêu cầu đặt đoàn của {request.CustomerName.Trim()}"
        };

        var grossAmount = tour.Price * request.GuestCount;
        var voucher = GetVoucherDiscount(request.VoucherCode, grossAmount);
        if (voucher.Error is not null)
        {
            return ServiceResult<BookingResponse>.BadRequest(voucher.Error);
        }

        var booking = new Booking
        {
            TourSchedule = schedule,
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            CustomerEmail = request.CustomerEmail.Trim(),
            GuestCount = request.GuestCount,
            BookingType = "PrivateGroup",
            VoucherCode = voucher.Code,
            VoucherDiscountAmount = voucher.DiscountAmount,
            TotalAmount = Math.Max(0, grossAmount - voucher.DiscountAmount),
            Status = "Pending"
        };

        schedules.Add(schedule);
        bookings.Add(booking);
        await bookings.SaveChangesAsync();

        return ServiceResult<BookingResponse>.Success(ToResponse(booking));
    }

    public async Task<ServiceResult<BookingResponse>> UpdateStatusAsync(int id, BookingStatusUpdate update)
    {
        var booking = await bookings.GetByIdAsync(id, includeTour: true);
        if (booking is null)
        {
            return ServiceResult<BookingResponse>.NotFound();
        }

        var nextStatus = update.Status.Trim();
        if (string.IsNullOrWhiteSpace(nextStatus))
        {
            return ServiceResult<BookingResponse>.BadRequest("Trạng thái không được để trống.");
        }

        var isPrivateGroup = IsPrivateGroup(booking);
        if (isPrivateGroup && nextStatus == "Confirmed" && booking.TourSchedule?.GuideUserId is null)
        {
            return ServiceResult<BookingResponse>.BadRequest("Vui lòng phân nhân viên trước khi xác nhận booking đoàn.");
        }

        if (nextStatus == "Cancelled" && booking.Status != "Cancelled")
        {
            if (isPrivateGroup)
            {
                booking.TourSchedule!.Status = "Cancelled";
            }
            else
            {
                booking.TourSchedule!.AvailableSeats += booking.GuestCount;
            }
        }

        booking.Status = nextStatus;
        await bookings.SaveChangesAsync();

        return ServiceResult<BookingResponse>.Success(ToResponse(booking));
    }

    public async Task<ServiceResult<BookingResponse>> AssignGuideAsync(int id, AssignGuideRequest request)
    {
        var booking = await bookings.GetByIdAsync(id, includeTour: true);
        if (booking is null)
        {
            return ServiceResult<BookingResponse>.NotFound();
        }

        if (!IsPrivateGroup(booking))
        {
            return ServiceResult<BookingResponse>.BadRequest("Chỉ booking đoàn mới cần phân nhân viên.");
        }

        if (booking.Status == "Cancelled")
        {
            return ServiceResult<BookingResponse>.BadRequest("Booking đã hủy, không thể phân nhân viên.");
        }

        if (request.GuideUserId is null)
        {
            return ServiceResult<BookingResponse>.BadRequest("Vui lòng chọn nhân viên.");
        }

        var guide = await users.GetGuideByIdAsync(request.GuideUserId);
        if (guide is null)
        {
            return ServiceResult<BookingResponse>.BadRequest("Nhân viên không hợp lệ.");
        }

        var schedule = booking.TourSchedule!;
        if (await schedules.HasGuideConflictAsync(guide.Id, schedule.StartDate, schedule.EndDate, schedule.Id))
        {
            return ServiceResult<BookingResponse>.BadRequest("Nhân viên đã có tour trong khoảng thời gian này.");
        }

        schedule.GuideUserId = guide.Id;
        schedule.GuideName = guide.FullName;
        schedule.Status = "Assigned";
        schedule.ScheduleType = "PrivateGroup";
        booking.Status = "Confirmed";

        await bookings.SaveChangesAsync();

        return ServiceResult<BookingResponse>.Success(ToResponse(booking));
    }

    public async Task<ServiceResult> DeleteAsync(int id)
    {
        var booking = await bookings.GetByIdAsync(id);
        if (booking is null)
        {
            return ServiceResult.NotFound();
        }

        if (IsPrivateGroup(booking))
        {
            schedules.Remove(booking.TourSchedule!);
        }
        else
        {
            if (booking.Status != "Cancelled")
            {
                booking.TourSchedule!.AvailableSeats += booking.GuestCount;
            }

            bookings.Remove(booking);
        }

        await bookings.SaveChangesAsync();

        return ServiceResult.Success();
    }

    private static BookingResponse ToResponse(Booking booking)
    {
        return new BookingResponse(
            booking.Id,
            booking.TourScheduleId,
            booking.TourSchedule!.Tour!.Name,
            booking.TourSchedule.StartDate,
            booking.TourSchedule.EndDate,
            booking.CustomerName,
            booking.CustomerPhone,
            booking.CustomerEmail,
            booking.GuestCount,
            booking.BookingType,
            booking.VoucherCode,
            booking.VoucherDiscountAmount,
            booking.TourSchedule.ScheduleType,
            booking.TourSchedule.Status,
            booking.TourSchedule.GuideUserId,
            booking.TourSchedule.GuideName,
            booking.TotalAmount,
            booking.Status,
            booking.PaymentMethod,
            booking.PaymentStatus,
            booking.MomoTransactionId ?? booking.MomoOrderId,
            booking.PaidAt,
            booking.CreatedAt);
    }

    private static string? Validate(BookingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerName)) return "Tên khách hàng không được để trống.";
        if (string.IsNullOrWhiteSpace(request.CustomerPhone)) return "Số điện thoại không được để trống.";
        if (string.IsNullOrWhiteSpace(request.CustomerEmail)) return "Email không được để trống.";
        if (!IsValidEmail(request.CustomerEmail)) return "Email không hợp lệ.";
        if (request.GuestCount <= 0) return "Số khách phải lớn hơn 0.";
        return null;
    }

    private static bool IsValidBookingType(string? bookingType)
    {
        return string.IsNullOrWhiteSpace(bookingType)
            || string.Equals(bookingType, "Shared", StringComparison.OrdinalIgnoreCase)
            || string.Equals(bookingType, "PrivateGroup", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsValidEmail(string email)
    {
        var trimmed = email.Trim();
        var atIndex = trimmed.IndexOf('@');
        var dotIndex = trimmed.LastIndexOf('.');
        return atIndex > 0 && dotIndex > atIndex + 1 && dotIndex < trimmed.Length - 1;
    }

    private static string NormalizeBookingType(string? bookingType)
    {
        return string.Equals(bookingType, "PrivateGroup", StringComparison.OrdinalIgnoreCase)
            ? "PrivateGroup"
            : "Shared";
    }

    private static VoucherApplyResult GetVoucherDiscount(string? voucherCode, decimal grossAmount)
    {
        if (string.IsNullOrWhiteSpace(voucherCode))
        {
            return new VoucherApplyResult(null, 0, null);
        }

        var code = voucherCode.Trim().ToUpperInvariant();
        if (!VoucherDiscounts.TryGetValue(code, out var discountAmount))
        {
            return new VoucherApplyResult(null, 0, "Mã voucher không hợp lệ.");
        }

        return new VoucherApplyResult(code, Math.Min(discountAmount, grossAmount), null);
    }

    private static bool IsPrivateGroup(Booking booking)
    {
        return booking.BookingType == "PrivateGroup"
            || booking.TourSchedule?.ScheduleType == "PrivateGroup";
    }

    private sealed record VoucherApplyResult(string? Code, decimal DiscountAmount, string? Error);
}
