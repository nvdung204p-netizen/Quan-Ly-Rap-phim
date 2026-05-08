# Hoàn thiện toàn bộ chức năng của Admin

Nhiệm vụ này yêu cầu xây dựng toàn bộ các tính năng quản lý (Admin Panel) còn thiếu trong hệ thống, bao gồm từ backend APIs đến giao diện frontend trên `AdminPage.jsx`.

## User Review Required

> [!WARNING]
> Vì phạm vi công việc rất lớn, kế hoạch này được chia thành nhiều giai đoạn. Bạn vui lòng xem qua các tính năng sẽ được bổ sung và xác nhận xem có cần bổ sung hay bỏ bớt tính năng nào không trước khi tiến hành thực hiện Giai đoạn 1.

## Open Questions

> [!IMPORTANT]
> - Về **Quản lý giá vé**: Giá vé hiện tại được tính dựa trên giá cơ bản của phim nhân với hệ số ghế. Bạn có muốn một giao diện riêng để cấu hình (thêm/sửa/xóa) `gia_ve_phim` và `loai_ghe` (hệ số giá) không?
> - Về **Quản lý phòng chiếu**: Bạn có muốn một công cụ vẽ sơ đồ ghế (Grid) trực quan không, hay chỉ cần một bảng danh sách ghế đơn giản theo dòng và cột?
> - Về **Hỗ trợ khách hàng**: Bạn có muốn admin có khả năng trả lời tin nhắn trực tiếp qua giao diện không (chat hỗ trợ), hay chỉ cần cập nhật danh sách kênh liên hệ?

## Proposed Changes

### Giai đoạn 1: Quản lý Phòng chiếu & Giá vé
- **Backend API**:
  - `phongChieuController.js`: CRUD phòng chiếu, sinh sơ đồ ghế tự động.
  - `gheController.js`: Quản lý loại ghế (thường/VIP/đôi) và bảo trì trạng thái ghế.
  - `giaVeController.js` (cập nhật): CRUD giá vé cơ bản của phim.
- **Frontend (`AdminPage.jsx`)**:
  - Thêm tab "Phòng & Ghế".
  - Thêm tab "Giá vé".

### Giai đoạn 2: Quản lý Phim & Suất chiếu (Nâng cao)
- **Backend API**:
  - Bổ sung validation: 1 phòng chỉ chiếu 1 phim tại 1 thời điểm.
  - Quản lý giới thiệu phim, trailer bổ sung, và đánh dấu "phim hot".
- **Frontend (`AdminPage.jsx`)**:
  - Cải thiện tab "Phim": Quản lý giới thiệu chi tiết, thêm nhiều trailer.

### Giai đoạn 3: Quản lý Giảm giá, Thành viên & Ngân hàng
- **Backend API**:
  - `giamGiaController.js`: Thêm, sửa, xóa mã giảm giá. Admin tặng mã cho User ID.
  - `thanhVienController.js`: Quản lý hạng thẻ, gia hạn thẻ.
  - `nganHangController.js`: Quản lý tài khoản ngân hàng nhận tiền.
- **Frontend (`AdminPage.jsx`)**:
  - Thêm tab "Khuyến mãi & Thành viên".
  - Thêm phần quản lý ngân hàng trong tab "Thanh toán".
  - Nâng cấp tab "Người dùng": xem chi tiết, tặng mã giảm giá.

### Giai đoạn 4: Sự kiện & Hỗ trợ khách hàng
- **Backend API**:
  - `suKienController.js` (cập nhật): CRUD sự kiện, chi tiết bài viết, ảnh trang chủ.
  - `hoTroController.js`: CRUD kênh liên hệ, quản lý cuộc hội thoại.
- **Frontend (`AdminPage.jsx`)**:
  - Thêm tab "Sự kiện & Tin tức".
  - Thêm tab "Hỗ trợ KH".

## Verification Plan

### Automated Tests
- Kiểm tra các ràng buộc logic: không cho phép tạo suất chiếu trùng lặp thời gian trong cùng một phòng.
- Đảm bảo các route Admin được bảo vệ bởi middleware `requireAuth(["ADMIN"])`.

### Manual Verification
- Truy cập vào trang quản trị (`/admin`), lần lượt mở các tab mới.
- Thử nghiệm tạo, sửa, xóa trên mỗi bảng dữ liệu.
- Kiểm tra tính liên kết: Tặng mã giảm giá cho user -> user thấy mã đó trong trang cá nhân / khi đặt vé.
