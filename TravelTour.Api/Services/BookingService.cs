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

    public async Task<List<BookingResponse>> GetMineAsync(string? customerEmail, string? customerName, string? username)
    {
        var all = await bookings.GetAllAsync();
        var mine = all.Where(booking => CanAccessBooking(booking, customerEmail, customerName, username, false));
        return mine.Select(ToResponse).ToList();
    }

    public async Task<ServiceResult<BookingResponse>> CreateAsync(BookingRequest request)
    {
        if (!IsValidBookingType(request.BookingType))
        {
            return ServiceResult<BookingResponse>.BadRequest("Hình thức đặt tour không hợp lệ.");
        }

        var bookingType = NormalizeBookingType(request.BookingType);
        var error = Validate(request, bookingType);
        if (error is not null)
        {
            return ServiceResult<BookingResponse>.BadRequest(error);
        }

        return bookingType == "PrivateGroup"
            ? await CreatePrivateGroupAsync(request)
            : await CreateSharedAsync(request);
    }

    public async Task<ServiceResult<BookingResponse>> GetContractAsync(
        int id,
        string? customerEmail,
        string? customerName,
        string? username,
        bool isPrivileged)
    {
        var booking = await bookings.GetByIdAsync(id, includeTour: true);
        if (booking is null)
        {
            return ServiceResult<BookingResponse>.NotFound();
        }

        if (!IsPrivateGroup(booking))
        {
            return ServiceResult<BookingResponse>.BadRequest("Chỉ booking đoàn mới có hợp đồng.");
        }

        if (!CanAccessBooking(booking, customerEmail, customerName, username, isPrivileged))
        {
            return ServiceResult<BookingResponse>.Forbidden("Bạn không có quyền xem hợp đồng này.");
        }

        return ServiceResult<BookingResponse>.Success(ToResponse(booking));
    }

    public async Task<ServiceResult<BookingResponse>> SignContractAsync(
        int id,
        CustomerContractSignatureRequest request,
        string? customerEmail,
        string? customerName,
        string? username)
    {
        var booking = await bookings.GetByIdAsync(id, includeTour: true);
        if (booking is null)
        {
            return ServiceResult<BookingResponse>.NotFound();
        }

        if (!IsPrivateGroup(booking))
        {
            return ServiceResult<BookingResponse>.BadRequest("Chỉ booking đoàn mới cần ký hợp đồng.");
        }

        if (!CanAccessBooking(booking, customerEmail, customerName, username, false))
        {
            return ServiceResult<BookingResponse>.Forbidden("Bạn không có quyền ký hợp đồng này.");
        }

        var contract = EnsurePrivateGroupContract(booking);
        if (contract.ContractStatus != "Confirmed")
        {
            return ServiceResult<BookingResponse>.BadRequest("Hợp đồng cần được Sales chốt trước khi khách xác nhận.");
        }

        if (contract.CustomerSignatureStatus == "Signed")
        {
            return ServiceResult<BookingResponse>.Success(ToResponse(booking));
        }

        contract.CustomerSignedByName = TrimToNull(request.SignedByName) ?? booking.CustomerName;
        contract.CustomerSignedAt = DateTime.UtcNow;
        contract.CustomerSignatureStatus = "Signed";
        await bookings.SaveChangesAsync();

        return ServiceResult<BookingResponse>.Success(ToResponse(booking));
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

        var grossAmount = schedule.Price * request.GuestCount;
        var voucher = GetVoucherDiscount(request.VoucherCode, grossAmount);
        if (voucher.Error is not null)
        {
            return ServiceResult<BookingResponse>.BadRequest(voucher.Error);
        }

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
            Status = "Pending",
            PaymentStatus = "Unpaid"
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

        var adultCount = request.AdultCount;
        var childCount = request.ChildCount;
        var guestCount = adultCount + childCount;

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

        if (guestCount < tour.MinGroupGuests)
        {
            return ServiceResult<BookingResponse>.BadRequest(
                $"Đi theo đoàn cần ít nhất {tour.MinGroupGuests} khách cho tour này.");
        }

        if (guestCount > tour.MaxGuests)
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
            AvailableSeats = guestCount,
            Price = tour.Price,
            OriginalPrice = tour.OriginalPrice,
            Status = "Pending",
            ScheduleType = "PrivateGroup",
            Note = $"Yêu cầu đặt đoàn của {request.CustomerName.Trim()}"
        };

        var estimatedAmount = adultCount * tour.Price + childCount * decimal.Round(tour.Price * 0.5m, 2, MidpointRounding.AwayFromZero);

        var booking = new Booking
        {
            TourSchedule = schedule,
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            CustomerEmail = request.CustomerEmail.Trim(),
            GuestCount = guestCount,
            BookingType = "PrivateGroup",
            TotalAmount = estimatedAmount,
            Status = "Pending",
            PaymentStatus = "Unpaid",
            PrivateGroupBookingDetails = new PrivateGroupBookingDetails
            {
                RequestNote = TrimToNull(request.RequestNote),
                AdultCount = adultCount,
                ChildCount = childCount,
                EstimatedAmount = estimatedAmount,
            },
            PrivateGroupContract = new PrivateGroupContract
            {
                ContractStatus = "Pending",
                CustomerSignatureStatus = "Pending",
            }
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
        if (isPrivateGroup && nextStatus == "Confirmed" && EnsurePrivateGroupContract(booking).ContractStatus != "Confirmed")
        {
            return ServiceResult<BookingResponse>.BadRequest("Vui lòng chốt hợp đồng đoàn trước khi xác nhận booking.");
        }

        if (nextStatus == "Cancelled" && booking.Status != "Cancelled")
        {
            if (isPrivateGroup)
            {
                booking.TourSchedule!.Status = "Cancelled";
                EnsurePrivateGroupContract(booking).ContractStatus = "Cancelled";
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

        return ServiceResult<BookingResponse>.BadRequest("Vui lòng dùng chức năng chốt hợp đồng đoàn để phân Sales, HDV và tổng hợp đồng.");
    }

    public async Task<ServiceResult<BookingResponse>> ConfirmContractAsync(int id, ContractConfirmationRequest request)
    {
        var booking = await bookings.GetByIdAsync(id, includeTour: true);
        if (booking is null)
        {
            return ServiceResult<BookingResponse>.NotFound();
        }

        if (!IsPrivateGroup(booking))
        {
            return ServiceResult<BookingResponse>.BadRequest("Chỉ booking đoàn mới cần chốt hợp đồng.");
        }

        if (booking.Status == "Cancelled")
        {
            return ServiceResult<BookingResponse>.BadRequest("Booking đã hủy, không thể chốt hợp đồng.");
        }

        if (request.ContractAmount <= 0)
        {
            return ServiceResult<BookingResponse>.BadRequest("Tổng hợp đồng phải lớn hơn 0.");
        }

        var sales = await users.GetSalesByIdAsync(request.SalesUserId);
        if (sales is null)
        {
            return ServiceResult<BookingResponse>.BadRequest("Nhân viên Sales không hợp lệ.");
        }

        var guide = await users.GetGuideByIdAsync(request.GuideUserId);
        if (guide is null)
        {
            return ServiceResult<BookingResponse>.BadRequest("Nhân viên không hợp lệ.");
        }

        var schedule = booking.TourSchedule!;
        var contract = EnsurePrivateGroupContract(booking);
        if (await schedules.HasGuideConflictAsync(guide.Id, schedule.StartDate, schedule.EndDate, schedule.Id))
        {
            return ServiceResult<BookingResponse>.BadRequest("Nhân viên đã có tour trong khoảng thời gian này.");
        }

        var depositAmount = decimal.Round(request.ContractAmount * 0.3m, 2, MidpointRounding.AwayFromZero);
        var remainingAmount = request.ContractAmount - depositAmount;

        schedule.GuideUserId = guide.Id;
        schedule.GuideName = guide.FullName;
        schedule.Price = decimal.Round(request.ContractAmount / Math.Max(1, booking.GuestCount), 2, MidpointRounding.AwayFromZero);
        schedule.Status = "Assigned";
        schedule.ScheduleType = "PrivateGroup";

        booking.TotalAmount = request.ContractAmount;
        contract.SalesUserId = sales.Id;
        contract.SalesName = sales.FullName;
        contract.ContractAmount = request.ContractAmount;
        contract.PaymentTerms = TrimToNull(request.PaymentTerms);
        contract.CancellationTerms = TrimToNull(request.CancellationTerms);
        contract.DepositAmount = depositAmount;
        contract.RemainingAmount = remainingAmount;
        contract.RemainingDueDate = schedule.StartDate.AddDays(-5);
        contract.DepositPaymentStatus = contract.DepositPaymentStatus == "Paid" ? "Paid" : "Unpaid";
        contract.RemainingPaymentStatus = contract.RemainingPaymentStatus == "Paid" ? "Paid" : "Unpaid";
        contract.SalesSignedByUserId = sales.Id;
        contract.SalesSignedByName = sales.FullName;
        contract.SalesSignedAt = DateTime.UtcNow;
        contract.ContractStatus = "Confirmed";
        booking.Status = "Confirmed";
        booking.PaymentStatus = contract.RemainingPaymentStatus == "Paid"
            ? "Paid"
            : contract.DepositPaymentStatus == "Paid"
                ? "DepositPaid"
                : "Unpaid";

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
            bookings.Remove(booking);
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
        var details = booking.PrivateGroupBookingDetails;
        var contract = booking.PrivateGroupContract;
        var isPrivateGroup = IsPrivateGroup(booking);
        var adultCount = isPrivateGroup ? details?.AdultCount ?? 0 : booking.GuestCount;
        var childCount = isPrivateGroup ? details?.ChildCount ?? 0 : 0;
        var estimatedAmount = isPrivateGroup ? details?.EstimatedAmount ?? booking.TotalAmount : booking.TotalAmount;

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
            details?.RequestNote,
            contract?.PaymentTerms,
            contract?.CancellationTerms,
            contract?.SalesUserId,
            contract?.SalesName,
            contract?.ContractStatus ?? "None",
            contract?.ContractAmount ?? 0,
            estimatedAmount,
            adultCount,
            childCount,
            contract?.DepositAmount ?? 0,
            contract?.RemainingAmount ?? 0,
            contract?.RemainingDueDate,
            contract?.DepositPaymentStatus ?? "Unpaid",
            contract?.RemainingPaymentStatus ?? "Unpaid",
            contract?.DepositPaidAt,
            contract?.RemainingPaidAt,
            contract?.SalesSignedByName,
            contract?.SalesSignedAt,
            contract?.CustomerSignedByName,
            contract?.CustomerSignedAt,
            contract?.CustomerSignatureStatus ?? "Pending",
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
            booking.MomoTransactionId ?? booking.MomoOrderId ?? contract?.DepositTransactionRef ?? contract?.RemainingTransactionRef,
            booking.PaidAt,
            booking.CreatedAt,
            booking.Passengers
                .OrderBy(passenger => passenger.DateOfBirth)
                .Select(passenger => new BookingPassengerResponse(
                    passenger.Id,
                    passenger.FullName,
                    passenger.DateOfBirth,
                    passenger.PassengerType,
                    passenger.IdentityNumber,
                    passenger.Phone))
                .ToList());
    }

    private static string? Validate(BookingRequest request, string bookingType)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerName)) return "Tên khách hàng không được để trống.";
        if (string.IsNullOrWhiteSpace(request.CustomerPhone)) return "Số điện thoại không được để trống.";
        if (string.IsNullOrWhiteSpace(request.CustomerEmail)) return "Email không được để trống.";
        if (!IsValidEmail(request.CustomerEmail)) return "Email không hợp lệ.";

        if (bookingType == "PrivateGroup")
        {
            if (request.AdultCount < 0) return "Số lượng người lớn không hợp lệ.";
            if (request.ChildCount < 0) return "Số lượng trẻ em không hợp lệ.";
            if (request.AdultCount + request.ChildCount <= 0) return "Tour đoàn cần có ít nhất 1 khách.";
            return null;
        }

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

    private static PrivateGroupContract EnsurePrivateGroupContract(Booking booking)
    {
        booking.PrivateGroupContract ??= new PrivateGroupContract
        {
            Booking = booking,
            BookingId = booking.Id,
            ContractStatus = "Pending",
            CustomerSignatureStatus = "Pending",
        };
        return booking.PrivateGroupContract;
    }

    private static bool CanAccessBooking(
        Booking booking,
        string? customerEmail,
        string? customerName,
        string? username,
        bool isPrivileged)
    {
        if (isPrivileged)
        {
            return true;
        }

        return (!string.IsNullOrWhiteSpace(customerEmail) && booking.CustomerEmail.Equals(customerEmail, StringComparison.OrdinalIgnoreCase))
            || (!string.IsNullOrWhiteSpace(customerName) && booking.CustomerName.Equals(customerName, StringComparison.OrdinalIgnoreCase))
            || (!string.IsNullOrWhiteSpace(username) && booking.CustomerName.Equals(username, StringComparison.OrdinalIgnoreCase));
    }

    private static string? TrimToNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private sealed record VoucherApplyResult(string? Code, decimal DiscountAmount, string? Error);
}
