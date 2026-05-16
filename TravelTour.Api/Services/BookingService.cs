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

        var booking = new Booking
        {
            TourScheduleId = request.TourScheduleId,
            TourSchedule = schedule,
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            GuestCount = request.GuestCount,
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
            booking.GuestCount,
            booking.TotalAmount,
            booking.Status,
            booking.PaymentMethod,
            booking.PaymentStatus,
            booking.CreatedAt);
    }

    private static string? Validate(BookingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerName)) return "Tên khách hàng không được để trống.";
        if (string.IsNullOrWhiteSpace(request.CustomerPhone)) return "Số điện thoại không được để trống.";
        if (request.GuestCount <= 0) return "Số khách phải lớn hơn 0.";
        return null;
    }
}
