# Kế hoạch Hoàn thiện Chức năng Nhân Viên (Staff Module)

Tính năng "Khu vực Nhân Viên" hiện tại mới chỉ có trang chủ và trang check-in mã QR cơ bản. Để hoàn thiện hệ sinh thái bán hàng trực tiếp tại rạp chiếu phim (Point Of Sale - POS), chúng ta cần bổ sung thêm các tính năng quan trọng sau đây.

## Quy trình Bán vé tại quầy (POS)
Nhân viên sẽ chọn Phim -> Suất Chiếu -> Sơ đồ Ghế -> Chọn Khách hàng (bằng Số điện thoại, nếu có) -> Chọn loại vé (Thường, SV, Trẻ em) -> Xác nhận thu tiền mặt. Toàn bộ thao tác diễn ra trên 1 màn hình duy nhất để đảm bảo tốc độ phục vụ khách hàng.

Kênh đặt vé tại quầy mặc định sẽ thanh toán thành công ngay lập tức bằng **Tiền Mặt**.

## Chi tiết Triển khai

### 1. Backend: Cập nhật APIs vận hành
- **datVeController.js**: Cập nhật hàm `taoDon`: Cho phép bypass lỗi "Cần đăng nhập" nếu người gọi API là `ADMIN` hoặc `NHAN_VIEN` và tham số `kenhDat === "QUAY"`.
- **vanHanhController.js**:
  - Thêm hàm `searchDonDatVe`: Tìm kiếm đơn hàng theo số điện thoại hoặc mã đơn để nhân viên tiện hỗ trợ/huỷ/đổi vé.
  - Cập nhật hàm `checkinQr`: Ghi nhận `checkin_boi` bằng ID của nhân viên soát vé.
- **vanHanh.routes.js**: Đăng ký route GET `/api/VanHanh/don-dat-ve` phục vụ việc tra cứu.

### 2. Frontend: Giao diện POS & Quản lý
- **StaffPOSPage.jsx** (Bán vé tại quầy): Xây dựng màn hình tối ưu cho POS:
  - Cột trái: Quản lý workflow (Chọn Phim -> Chọn Suất -> Chọn Ghế).
  - Cột phải: Khung hóa đơn hiện tại, tìm kiếm khách hàng, nút Thanh toán Tiền mặt.
- **StaffOrdersPage.jsx** (Tra cứu đơn): Giao diện tra cứu lịch sử mua vé theo ngày hoặc theo thông tin khách. Hỗ trợ xem mã QR của vé hoặc in vé.
- **StaffCheckinPage.jsx**: Bổ sung hiển thị thông tin chi tiết của vé vừa soát (Ghế, Phim, Tên Khách).
- **StaffLayout.jsx**: Thêm 2 NavLink mới: **Bán vé tại quầy (POS)** và **Tra cứu đơn hàng**.
- **AppRoutes.jsx**: Đăng ký các route `/nhan-vien/pos` và `/nhan-vien/don-hang`.
