# Tien do du an Quan Ly Tour Du Lich

## Tong quan

- Ten du an: Travel Tour Management
- Backend: ASP.NET Core Web API (MVC Controllers)
- Frontend: React (Vite)
- Database: SQL Server Express
- ORM: Entity Framework Core
- Auth: JWT Bearer Token
- Trang thai hien tai: Da hoan thanh MVP

## Muc tieu MVP

1. Dang nhap va phan quyen co ban. ✅
2. Quan ly tour du lich. ✅
3. Quan ly lich khoi hanh. ✅
4. Dat tour va quan ly booking. ✅
5. Quan ly khach hang. ✅
6. Thong ke doanh thu co ban. ✅

## Tien do

| Ngay | Hang muc | Trang thai | Ghi chu |
| --- | --- | --- | --- |
| 2026-04-25 | Khoi tao du an | Hoan thanh | Solution, backend, frontend |
| 2026-04-25 | Cau hinh EF Core + Models | Hoan thanh | Tour, TourSchedule, Booking |
| 2026-04-25 | CRUD API Tour | Hoan thanh | Minimal API -> MVC Controllers |
| 2026-04-25 | Frontend Dashboard + Tour List | Hoan thanh | React components |
| 2026-04-25 | Database Migration | Hoan thanh | InitialCreate + AddUserAndCustomer |
| 2026-04-25 | Schedule + Booking API | Hoan thanh | Full CRUD + business logic |
| 2026-04-25 | Refactor MVC Controllers | Hoan thanh | ToursController, SchedulesController, BookingsController |
| 2026-04-25 | JWT Authentication | Hoan thanh | Login/Register, [Authorize], Bearer token |
| 2026-04-25 | Customer Model + CRUD | Hoan thanh | CustomersController + CustomerList.jsx |
| 2026-04-25 | Bao cao doanh thu | Hoan thanh | ReportsController + ReportPage.jsx + bieu do |
| 2026-04-25 | Xuat CSV | Hoan thanh | Export bookings + revenue CSV |
| 2026-04-25 | Tich hop thanh toan MoMo | Hoan thanh mot phan | Them backend service/controller, frontend button, migration. Chua apply DB do loi SQL Server SSPI local |

## Cau truc du an

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
├── Program.cs
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

## Ghi chu ky thuat

- SQL Server Express: `.\SQLEXPRESS`
- JWT token het han sau 12 gio
- User dau tien dang ky se la Admin
- Booking tu tinh TotalAmount = Price * GuestCount
- Khi cancel/xoa booking, AvailableSeats duoc hoan lai
- Xoa tour/schedule kiem tra FK constraint truoc
- Frontend dung Vite proxy de goi API
- MoMo sandbox can cau hinh `Momo:PartnerCode`, `Momo:AccessKey`, `Momo:SecretKey`.
- MoMo IPN local can public HTTPS URL de MoMo goi duoc backend.
- Migration `AddMomoPaymentFields` da tao, nhung `dotnet ef database update` dang loi SQL Server local: `Cannot generate SSPI context`.
