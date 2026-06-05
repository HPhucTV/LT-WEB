# Chức năng và Luồng hoạt động của Dự án Quản lý Tour Du lịch (Travel Tour Management)

Dựa trên cấu trúc source code hiện tại (API Controllers, Frontend API Client và tiến độ dự án), hệ thống được chia thành **10 nhóm chức năng chính** và có luồng hoạt động (flow) gắn kết logic với nhau.

---

## I. Tổng hợp 10 Nhóm chức năng hiện có

1. **Xác thực & Phân quyền (Auth)**: Đăng nhập, đăng ký tài khoản, lấy thông tin cá nhân. Phân quyền hệ thống dựa trên vai trò (Role: Admin, User, Guide, Staff...).
2. **Quản lý Người dùng (Users - Admin)**: Xem danh sách tài khoản trên hệ thống, phân quyền (thay đổi Role) và xóa tài khoản người dùng.
3. **Quản lý Tour Du lịch (Tours)**: Tạo mới, cập nhật, xóa và xem danh sách chi tiết các Tour du lịch. Hỗ trợ xem điểm đánh giá (ratings) trung bình.
4. **Quản lý Lịch khởi hành (Schedules)**: Lên lịch các chuyến đi cụ thể cho từng Tour (Ngày đi, ngày về, giới hạn số chỗ trống `AvailableSeats`). Phân công Hướng dẫn viên cho lịch trình.
5. **Quản lý Lịch Hướng dẫn viên (Guide Availabilities)**: Hướng dẫn viên (Guide) đăng ký/cập nhật thời gian rảnh của mình. Quản lý có thể tra cứu lịch trống để phân công công việc.
6. **Đặt Tour & Quản lý Booking (Bookings)**: Khách hàng tạo đơn đặt tour. Admin/Staff có thể quản lý danh sách toàn bộ Booking, cập nhật trạng thái đơn (Pending, Confirmed, Completed, Cancelled).
7. **Quản lý Khách hàng (Customers)**: Quản lý thông tin hồ sơ của khách hàng (lưu trữ danh bạ khách hàng đã từng tương tác hoặc đặt tour).
8. **Tích hợp Thanh toán (Payments)**: Hỗ trợ thanh toán trực tuyến qua cổng **VNPay** (và đã có thiết kế sơ bộ cho MoMo).
9. **Đánh giá & Nhận xét (Reviews)**: Khách hàng viết nhận xét, chấm điểm cho Tour sau khi trải nghiệm. Quản lý được các đánh giá cá nhân.
10. **Báo cáo & Thống kê (Reports)**: Dashboard thống kê tổng quan. Báo cáo doanh thu theo khoảng thời gian và chức năng Xuất dữ liệu (Export CSV) cho danh sách Booking và Doanh thu.

---

## II. Phân rã Luồng hoạt động (Flow) theo trình tự

Hệ thống xoay quanh 4 luồng quy trình làm việc (Workflow) chính:

### 1. Luồng Thiết lập Hệ thống & Sản phẩm (Admin / Staff Flow)
Luồng này được thực hiện trước khi khách hàng có thể đặt tour.
- **Bước 1:** Admin/Staff đăng nhập vào hệ thống.
- **Bước 2 (Tạo Tour):** Vào trang Quản lý Tour, tạo các Tour du lịch gốc (Nhập Tên tour, mô tả, mức giá, hình ảnh...).
- **Bước 3 (Lên Lịch trình):** Chọn một Tour cụ thể và tạo các **Lịch khởi hành (Schedules)**. Thiết lập ngày khởi hành, ngày kết thúc và số lượng chỗ ngồi tối đa.
- **Bước 4 (Nhân sự - Tùy chọn):** Hướng dẫn viên đăng nhập và cập nhật "Thời gian rảnh" (Availabilities). Quản lý tra cứu và **Phân công HDV** vào các Lịch khởi hành tương ứng.

### 2. Luồng Khách hàng Đặt Tour & Thanh toán (Customer Booking Flow)
Luồng thao tác trực tiếp của người dùng/khách hàng.
- **Bước 1 (Tìm kiếm):** Khách hàng duyệt xem danh sách Tour hiển thị trên ứng dụng, đọc thông tin chi tiết và tham khảo Đánh giá (Reviews).
- **Bước 2 (Chọn lịch):** Xem các Lịch khởi hành của Tour và chọn một lịch trình ngày giờ phù hợp, đảm bảo `AvailableSeats > 0` (còn chỗ trống).
- **Bước 3 (Tạo Booking):** Điền thông tin cá nhân (Họ tên, SĐT, Email) và nhập Số lượng người đi (`GuestCount`).
  - *Hệ thống tự động:* Tính toán tổng tiền, tạo Booking ở trạng thái **Chờ thanh toán (Pending)**, đồng thời giữ chỗ bằng cách trừ đi `AvailableSeats` trong Lịch khởi hành.
- **Bước 4 (Thanh toán):** Khách hàng bấm thanh toán qua cổng VNPay.
- **Bước 5 (Xác nhận):**
  - *Thành công:* Cổng thanh toán trả kết quả về, hệ thống tự cập nhật trạng thái Booking thành **Đã thanh toán (Paid/Confirmed)**.
  - *Hủy/Thất bại:* Booking bị hủy, hệ thống tự động hoàn lại số chỗ trống (`AvailableSeats`) cho Lịch trình.

### 3. Luồng Hậu mãi và Đánh giá (Post-Tour Flow)
- **Bước 1 (Trải nghiệm):** Khách hàng tham gia chuyến đi.
- **Bước 2 (Hoàn thành):** Sau khi Tour kết thúc theo thời gian trên hệ thống, trạng thái Booking/Lịch trình được chuyển thành **Completed**.
- **Bước 3 (Đánh giá):** Khách hàng đăng nhập vào mục Lịch sử Booking của mình, tiến hành viết nhận xét và chấm điểm sao (Reviews). Các đánh giá này ngay lập tức cập nhật lại Rating trung bình của Tour.

### 4. Luồng Quản lý Doanh thu & Báo cáo (Management Flow)
- **Bước 1 (Theo dõi):** Quản lý/Admin theo dõi thông tin theo thời gian thực trên màn hình Dashboard tổng quan.
- **Bước 2 (Chăm sóc Khách hàng):** Xem danh sách và lịch sử đặt tour trong module **Customers** để chăm sóc khách hàng.
- **Bước 3 (Thống kê):** Cuối tháng/quý, vào trang **Báo cáo (Reports)**, nhập từ ngày - đến ngày để phân tích biểu đồ doanh thu thực tế.
- **Bước 4 (Kế toán):** Nhấn nút **Xuất CSV** để lấy dữ liệu Bookings và Doanh thu dưới dạng file Excel/CSV phục vụ lưu trữ tài liệu kế toán.
