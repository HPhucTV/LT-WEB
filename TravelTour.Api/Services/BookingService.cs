using TravelTour.Api.Contracts;
using TravelTour.Api.Models;
using TravelTour.Api.Repositories;

namespace TravelTour.Api.Services;

public class BookingService(IBookingRepository bookings, IScheduleRepository schedules)
{
    public async Task<List<BookingResponse>> GetAllAsync()
    {
        return (await bookings.GetAllAsync()).Select(ToResponse).ToList();
    }

    public async Task<ServiceResult<BookingResponse>> CreateAsync(BookingRequest request)
    {
        var error = Validate(request);
        if (error is not null)
        {
            return ServiceResult<BookingResponse>.BadRequest(error);
        }

        var schedule = await schedules.GetByIdAsync(request.TourScheduleId, includeTour: true);
        if (schedule is null)
        {
            return ServiceResult<BookingResponse>.BadRequest("Lịch khởi hành không tồn tại.");
        }

        if (schedule.Status != "Open")
        {
            return ServiceResult<BookingResponse>.BadRequest("Lịch khởi hành này đã đóng, không thể đặt tour.");
        }

        if (request.GuestCount > schedule.AvailableSeats)
        {
            return ServiceResult<BookingResponse>.BadRequest($"Chỉ còn {schedule.AvailableSeats} chỗ trống.");
        }

        var bookingType = NormalizeBookingType(request.BookingType);
        if (bookingType == "PrivateGroup" && request.GuestCount < schedule.Tour!.MinGroupGuests)
        {
            return ServiceResult<BookingResponse>.BadRequest(
                $"Đi theo đoàn cần ít nhất {schedule.Tour.MinGroupGuests} khách cho tour này.");
        }

        var booking = new Booking
        {
            TourScheduleId = request.TourScheduleId,
            TourSchedule = schedule,
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            CustomerEmail = request.CustomerEmail.Trim(),
            GuestCount = request.GuestCount,
            BookingType = bookingType,
            TotalAmount = schedule.Tour!.Price * request.GuestCount,
            Status = "Pending"
        };

        schedule.AvailableSeats -= request.GuestCount;
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

        if (update.Status == "Cancelled" && booking.Status != "Cancelled")
        {
            booking.TourSchedule!.AvailableSeats += booking.GuestCount;
        }

        booking.Status = update.Status.Trim();
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

        if (booking.Status != "Cancelled")
        {
            booking.TourSchedule!.AvailableSeats += booking.GuestCount;
        }

        bookings.Remove(booking);
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
            booking.CustomerName,
            booking.CustomerPhone,
            booking.CustomerEmail,
            booking.GuestCount,
            booking.BookingType,
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
        if (!IsValidBookingType(request.BookingType)) return "Hình thức đặt tour không hợp lệ.";
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
}
