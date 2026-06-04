# Tiến độ dự án Quản lý Tour Du lịch

## Tổng quan

- Tên dự án: Travel Tour Management
- Backend: ASP.NET Core Web API (MVC Controllers)
- Frontend: React (Vite)
- Database: SQL Server Express
- ORM: Entity Framework Core
- Auth: JWT Bearer Token
- Trạng thái hiện tại: Đã hoàn thành MVP

## Mục tiêu MVP

1. Đăng nhập và phân quyền cơ bản. ✅
2. Quản lý tour du lịch. ✅
3. Quản lý lịch khởi hành. ✅
4. Đặt tour và quản lý booking. ✅
5. Quản lý khách hàng. ✅
6. Thống kê doanh thu cơ bản. ✅

## Tiến độ

| Ngày | Hạng mục | Trạng thái | Ghi chú |
| --- | --- | --- | --- |
| 2026-04-25 | Khởi tạo dự án | Hoàn thành | Solution, backend, frontend |
| 2026-04-25 | Cấu hình EF Core + Models | Hoàn thành | Tour, TourSchedule, Booking |
| 2026-04-25 | CRUD API Tour | Hoàn thành | Minimal API -> MVC Controllers |
| 2026-04-25 | Frontend Dashboard + Tour List | Hoàn thành | React components |
| 2026-04-25 | Database Migration | Hoàn thành | InitialCreate + AddUserAndCustomer |
| 2026-04-25 | Schedule + Booking API | Hoàn thành | Full CRUD + business logic |
| 2026-04-25 | Refactor MVC Controllers | Hoàn thành | ToursController, SchedulesController, BookingsController |
| 2026-04-25 | JWT Authentication | Hoàn thành | Login/Register, [Authorize], Bearer token |
| 2026-04-25 | Customer Model + CRUD | Hoàn thành | CustomersController + CustomerList.jsx |
| 2026-04-25 | Báo cáo doanh thu | Hoàn thành | ReportsController + ReportPage.jsx + biểu đồ |
| 2026-04-25 | Xuất CSV | Hoàn thành | Export bookings + revenue CSV |
| 2026-04-25 | Tích hợp thanh toán MoMo | Hoàn thành một phần | Thêm backend service/controller, frontend button, migration. Chưa apply DB do lỗi SQL Server SSPI local |

## Cấu trúc dự án

```
TravelTour.Api/
├── Controllers/
│   ├── AuthController.cs
│   ├── ToursController.cs
│   ├── SchedulesController.cs
│   ├── BookingsController.cs
│   ├── CustomersController.cs
│   └── ReportsController.cs
├── Models/
│   ├── User.cs
│   ├── Tour.cs
│   ├── TourSchedule.cs
│   ├── Booking.cs
│   └── Customer.cs
├── Contracts/
│   ├── AuthContracts.cs
│   ├── TourContracts.cs
│   ├── ScheduleContracts.cs
│   ├── BookingContracts.cs
│   └── CustomerContracts.cs
├── Data/
│   └── AppDbContext.cs
├── Migrations/
│   └── Program.cs
└── appsettings.json

TravelTour.Client/
├── src/
│   ├── api.js
│   ├── App.jsx
│   ├── App.css
│   └── components/
│       ├── LoginPage.jsx
│       ├── Dashboard.jsx
│       ├── TourList.jsx
│       ├── TourForm.jsx
│       ├── ScheduleList.jsx
│       ├── BookingList.jsx
│       ├── CustomerList.jsx
│       └── ReportPage.jsx
├── vite.config.js
└── package.json
```

## Ghi chú kỹ thuật

- SQL Server Express: `.\SQLEXPRESS`
- JWT token hết hạn sau 12 giờ
- User đầu tiên đăng ký sẽ là Admin
- Booking tự tính TotalAmount = Price * GuestCount
- Khi cancel/xóa booking, AvailableSeats được hoàn lại
- Xóa tour/schedule kiểm tra FK constraint trước
- Frontend dùng Vite proxy để gọi API
- MoMo sandbox cần cấu hình `Momo:PartnerCode`, `Momo:AccessKey`, `Momo:SecretKey`.
- MoMo IPN local cần public HTTPS URL để MoMo gọi được backend.
- Migration `AddMomoPaymentFields` đã tạo, nhưng `dotnet ef database update` đang lỗi SQL Server local: `Cannot generate SSPI context`.
