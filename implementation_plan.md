# Kế hoạch Triển khai Chức năng Nhân viên & Thanh toán Tiền mặt

Tính năng này nhằm mục đích hoàn thiện luồng nghiệp vụ của nhân viên tại quầy: In hóa đơn/vé, theo dõi lịch sử bán vé cá nhân, và hỗ trợ thanh toán cho khách đặt online chọn hình thức "Tiền mặt".

## User Review Required

> [!IMPORTANT]
> - Thiết kế hóa đơn/vé in ra sẽ hiển thị dưới dạng một hộp thoại mới để tiện in ấn (sử dụng tính năng `window.print()` của trình duyệt). Bạn có đồng ý với giao diện in tối giản đen trắng giống với máy in nhiệt không?
> - Việc nhân viên "Thanh toán giúp khách" sẽ thay đổi trạng thái vé của khách thành `DA_THANH_TOAN`.

## Proposed Changes

---

### Backend (`backend_node`)

#### [MODIFY] `backend_node/src/controllers/datVeController.js`
- **Sửa API `thanhToan`**:
  - Cho phép `NHAN_VIEN` hoặc `ADMIN` được quyền gọi API thanh toán cho đơn hàng của tài khoản khác (hiện tại API đang chặn chỉ chủ đơn mới được thanh toán).
  - Kiểm tra thêm điều kiện: Nếu phương thức thanh toán là `TIEN_MAT`, người gọi API bắt buộc phải là `NHAN_VIEN` hoặc `ADMIN`. Khách hàng thông thường không thể tự bấm "Thanh toán" online và tự biến đơn thành `DA_THANH_TOAN` nếu phương thức là `TIEN_MAT`.

#### [MODIFY] `backend_node/src/controllers/adminBaoCaoController.js` (hoặc tạo controller mới)
- **Thêm API `GET /api/Admin/don-nhan-vien`**:
  - Truy xuất các đơn hàng được thực hiện/xác nhận thanh toán bởi nhân viên hiện tại để hiển thị "Lịch sử mua vé của nhân viên".

---

### Frontend (`frontend`)

#### [MODIFY] `frontend/src/pages/StaffPOSPage.jsx`
- Sau khi bấm "Thanh Toán Tiền Mặt" thành công, ngoài hiển thị thông báo, sẽ hiện thêm nút **"🖨️ In Hóa Đơn & Vé"**.
- Code phần giao diện ẩn chỉ dành cho máy in (`@media print`) hoặc mở popup chứa thông tin hóa đơn bao gồm:
  - Tên rạp chiếu.
  - Phim, Suất chiếu, Phòng, Ghế.
  - Tên nhân viên thu ngân (lấy từ thông tin đăng nhập của staff).
  - Mã QR của các vé.

#### [MODIFY] `frontend/src/pages/StaffOrdersPage.jsx`
- Bổ sung cột/nút **Hành động** cho mỗi đơn hàng trong kết quả tra cứu:
  - Nút **"Thanh toán (Tiền mặt)"**: Hiển thị nếu trạng thái đơn là `CHO_THANH_TOAN`. Bấm vào sẽ gọi API thanh toán.
  - Nút **"In vé"**: Bấm vào để in hóa đơn/vé giống như chức năng ở màn POS.
- Bổ sung một tab hoặc bộ lọc: **"Lịch sử đơn của tôi"** để nhân viên xem những vé mình đã bán/xử lý trong ngày.

#### [MODIFY] `frontend/src/pages/BookingPage.jsx`
- Ẩn nút "Thanh toán" đối với khách hàng tự đặt nếu họ chọn phương thức "Tiền mặt" (hoặc hiện thông báo "Vui lòng đến quầy đưa mã đơn cho nhân viên để thanh toán và lấy vé").

## Verification Plan

### Automated Tests
- Kiểm tra các endpoint API backend với Postman hoặc script test.

### Manual Verification
- **Test Case 1 (POS)**: Nhân viên đặt vé qua màn hình POS -> Đơn thành công -> Bấm "In vé" -> Trình duyệt hiện hộp thoại Print preview với giao diện in nhiệt.
- **Test Case 2 (Khách online)**: Khách hàng lên web, đặt vé chọn "Tiền mặt" -> Trạng thái báo Chưa thanh toán -> Yêu cầu đến quầy.
- **Test Case 3 (Nhân viên tra cứu)**: Nhân viên vào "Tra cứu đơn hàng", nhập mã đơn của khách -> Thấy trạng thái `CHO_THANH_TOAN` -> Bấm "Thanh toán" -> Đơn chuyển thành công -> Bấm in vé trả cho khách.
- **Test Case 4 (Lịch sử nhân viên)**: Nhân viên xem lại danh sách đơn mình đã thao tác.
