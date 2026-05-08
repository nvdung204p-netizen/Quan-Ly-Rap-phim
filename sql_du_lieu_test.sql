-- ============================================================
-- sql_du_lieu_test.sql
-- Dữ liệu test đầy đủ cho QuanLyRapChieuPhim
-- Mật khẩu tất cả tài khoản: Admin@123
-- Chạy SAU khi đã chạy sql_schema_day_du.sql
-- ============================================================
USE QuanLyRapChieuPhim;
GO

-- ============================================================
-- TÀI KHOẢN TEST
-- Hash tương ứng mật khẩu: Admin@123
-- (PBKDF2 / format tương thích backend Node hiện tại)
-- ============================================================

-- 1 Admin
IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE email = N'admin@cinema.vn')
  INSERT INTO tai_khoan(email, so_dien_thoai, mat_khau_hash, ho_ten, gioi_tinh, trang_thai, tao_luc, cap_nhat_luc)
  VALUES(N'admin@cinema.vn', N'0900000001',
    N'100000.7rNZRWnaqxVH/jQB9Kxevg==.0qN8inWgAngrQiWmO5ZIW2iIvruhkgslMXn9mMuXsZw=',
    N'Nguyễn Văn Admin', N'NAM', N'HOAT_DONG', SYSUTCDATETIME(), SYSUTCDATETIME());

-- 2 Nhân viên
IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE email = N'nhanvien1@cinema.vn')
  INSERT INTO tai_khoan(email, so_dien_thoai, mat_khau_hash, ho_ten, gioi_tinh, trang_thai, tao_luc, cap_nhat_luc)
  VALUES(N'nhanvien1@cinema.vn', N'0900000002',
    N'100000.7rNZRWnaqxVH/jQB9Kxevg==.0qN8inWgAngrQiWmO5ZIW2iIvruhkgslMXn9mMuXsZw=',
    N'Trần Thị Nhân Viên', N'NU', N'HOAT_DONG', SYSUTCDATETIME(), SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE email = N'nhanvien2@cinema.vn')
  INSERT INTO tai_khoan(email, so_dien_thoai, mat_khau_hash, ho_ten, gioi_tinh, trang_thai, tao_luc, cap_nhat_luc)
  VALUES(N'nhanvien2@cinema.vn', N'0900000003',
    N'100000.7rNZRWnaqxVH/jQB9Kxevg==.0qN8inWgAngrQiWmO5ZIW2iIvruhkgslMXn9mMuXsZw=',
    N'Lê Văn Checkin', N'NAM', N'HOAT_DONG', SYSUTCDATETIME(), SYSUTCDATETIME());

-- 5 Khách hàng (đa dạng)
IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE email = N'khach1@gmail.com')
  INSERT INTO tai_khoan(email, so_dien_thoai, mat_khau_hash, ho_ten, gioi_tinh, trang_thai, tao_luc, cap_nhat_luc)
  VALUES(N'khach1@gmail.com', N'0911000001',
    N'100000.7rNZRWnaqxVH/jQB9Kxevg==.0qN8inWgAngrQiWmO5ZIW2iIvruhkgslMXn9mMuXsZw=',
    N'Nguyễn Thị Mai', N'NU', N'HOAT_DONG', SYSUTCDATETIME(), SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE email = N'khach2@gmail.com')
  INSERT INTO tai_khoan(email, so_dien_thoai, mat_khau_hash, ho_ten, gioi_tinh, trang_thai, tao_luc, cap_nhat_luc)
  VALUES(N'khach2@gmail.com', N'0911000002',
    N'100000.7rNZRWnaqxVH/jQB9Kxevg==.0qN8inWgAngrQiWmO5ZIW2iIvruhkgslMXn9mMuXsZw=',
    N'Phạm Văn Hùng', N'NAM', N'HOAT_DONG', SYSUTCDATETIME(), SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE email = N'khach3@gmail.com')
  INSERT INTO tai_khoan(email, so_dien_thoai, mat_khau_hash, ho_ten, gioi_tinh, trang_thai, tao_luc, cap_nhat_luc)
  VALUES(N'khach3@gmail.com', N'0911000003',
    N'100000.7rNZRWnaqxVH/jQB9Kxevg==.0qN8inWgAngrQiWmO5ZIW2iIvruhkgslMXn9mMuXsZw=',
    N'Lê Thị Hoa', N'NU', N'HOAT_DONG', SYSUTCDATETIME(), SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE email = N'vip@gmail.com')
  INSERT INTO tai_khoan(email, so_dien_thoai, mat_khau_hash, ho_ten, gioi_tinh, trang_thai, tao_luc, cap_nhat_luc)
  VALUES(N'vip@gmail.com', N'0911000004',
    N'100000.7rNZRWnaqxVH/jQB9Kxevg==.0qN8inWgAngrQiWmO5ZIW2iIvruhkgslMXn9mMuXsZw=',
    N'Hoàng Minh VIP', N'NAM', N'HOAT_DONG', SYSUTCDATETIME(), SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE email = N'member@gmail.com')
  INSERT INTO tai_khoan(email, so_dien_thoai, mat_khau_hash, ho_ten, gioi_tinh, trang_thai, tao_luc, cap_nhat_luc)
  VALUES(N'member@gmail.com', N'0911000005',
    N'100000.7rNZRWnaqxVH/jQB9Kxevg==.0qN8inWgAngrQiWmO5ZIW2iIvruhkgslMXn9mMuXsZw=',
    N'Vũ Thị Thành Viên', N'NU', N'HOAT_DONG', SYSUTCDATETIME(), SYSUTCDATETIME());
GO

-- ============================================================
-- GÁN VAI TRÒ
-- ============================================================
DECLARE @vtAdmin   INT = (SELECT TOP 1 vai_tro_id FROM vai_tro WHERE ma_vai_tro = N'ADMIN');
DECLARE @vtNV      INT = (SELECT TOP 1 vai_tro_id FROM vai_tro WHERE ma_vai_tro = N'NHAN_VIEN');
DECLARE @vtKH      INT = (SELECT TOP 1 vai_tro_id FROM vai_tro WHERE ma_vai_tro = N'KHACH_HANG');

DECLARE @tkAdmin  BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'admin@cinema.vn');
DECLARE @tkNV1    BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'nhanvien1@cinema.vn');
DECLARE @tkNV2    BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'nhanvien2@cinema.vn');
DECLARE @tkKH1    BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'khach1@gmail.com');
DECLARE @tkKH2    BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'khach2@gmail.com');
DECLARE @tkKH3    BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'khach3@gmail.com');
DECLARE @tkVip    BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'vip@gmail.com');
DECLARE @tkMember BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'member@gmail.com');

-- Admin
IF @tkAdmin IS NOT NULL AND @vtAdmin IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tai_khoan_vai_tro WHERE tai_khoan_id=@tkAdmin AND vai_tro_id=@vtAdmin)
  INSERT INTO tai_khoan_vai_tro(tai_khoan_id,vai_tro_id) VALUES(@tkAdmin,@vtAdmin);

-- Nhân viên
IF @tkNV1 IS NOT NULL AND @vtNV IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tai_khoan_vai_tro WHERE tai_khoan_id=@tkNV1 AND vai_tro_id=@vtNV)
  INSERT INTO tai_khoan_vai_tro(tai_khoan_id,vai_tro_id) VALUES(@tkNV1,@vtNV);
IF @tkNV2 IS NOT NULL AND @vtNV IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tai_khoan_vai_tro WHERE tai_khoan_id=@tkNV2 AND vai_tro_id=@vtNV)
  INSERT INTO tai_khoan_vai_tro(tai_khoan_id,vai_tro_id) VALUES(@tkNV2,@vtNV);

-- Khách hàng
IF @tkKH1 IS NOT NULL AND @vtKH IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tai_khoan_vai_tro WHERE tai_khoan_id=@tkKH1 AND vai_tro_id=@vtKH)
  INSERT INTO tai_khoan_vai_tro(tai_khoan_id,vai_tro_id) VALUES(@tkKH1,@vtKH);
IF @tkKH2 IS NOT NULL AND @vtKH IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tai_khoan_vai_tro WHERE tai_khoan_id=@tkKH2 AND vai_tro_id=@vtKH)
  INSERT INTO tai_khoan_vai_tro(tai_khoan_id,vai_tro_id) VALUES(@tkKH2,@vtKH);
IF @tkKH3 IS NOT NULL AND @vtKH IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tai_khoan_vai_tro WHERE tai_khoan_id=@tkKH3 AND vai_tro_id=@vtKH)
  INSERT INTO tai_khoan_vai_tro(tai_khoan_id,vai_tro_id) VALUES(@tkKH3,@vtKH);
IF @tkVip IS NOT NULL AND @vtKH IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tai_khoan_vai_tro WHERE tai_khoan_id=@tkVip AND vai_tro_id=@vtKH)
  INSERT INTO tai_khoan_vai_tro(tai_khoan_id,vai_tro_id) VALUES(@tkVip,@vtKH);
IF @tkMember IS NOT NULL AND @vtKH IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tai_khoan_vai_tro WHERE tai_khoan_id=@tkMember AND vai_tro_id=@vtKH)
  INSERT INTO tai_khoan_vai_tro(tai_khoan_id,vai_tro_id) VALUES(@tkMember,@vtKH);
GO

-- ============================================================
-- THẺ THÀNH VIÊN
-- ============================================================
DECLARE @tkVip    BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'vip@gmail.com');
DECLARE @tkMember BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'member@gmail.com');
DECLARE @tkKH1    BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'khach1@gmail.com');

-- VIP
IF @tkVip IS NOT NULL AND NOT EXISTS (SELECT 1 FROM the_thanh_vien WHERE tai_khoan_id=@tkVip)
  INSERT INTO the_thanh_vien(tai_khoan_id,hang_thanh_vien,ngay_bat_dau,ngay_ket_thuc,trang_thai)
  VALUES(@tkVip, N'VIP', CAST(DATEADD(MONTH,-3,GETDATE()) AS DATE), CAST(DATEADD(MONTH,9,GETDATE()) AS DATE), N'HOAT_DONG');

-- Thường
IF @tkMember IS NOT NULL AND NOT EXISTS (SELECT 1 FROM the_thanh_vien WHERE tai_khoan_id=@tkMember)
  INSERT INTO the_thanh_vien(tai_khoan_id,hang_thanh_vien,ngay_bat_dau,ngay_ket_thuc,trang_thai)
  VALUES(@tkMember, N'THUONG', CAST(DATEADD(MONTH,-1,GETDATE()) AS DATE), CAST(DATEADD(MONTH,11,GETDATE()) AS DATE), N'HOAT_DONG');

-- khach1 thành viên thường
IF @tkKH1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM the_thanh_vien WHERE tai_khoan_id=@tkKH1)
  INSERT INTO the_thanh_vien(tai_khoan_id,hang_thanh_vien,ngay_bat_dau,ngay_ket_thuc,trang_thai)
  VALUES(@tkKH1, N'THUONG', CAST(DATEADD(MONTH,-2,GETDATE()) AS DATE), CAST(DATEADD(MONTH,10,GETDATE()) AS DATE), N'HOAT_DONG');
GO

-- ============================================================
-- ĐIỂM THƯỞNG
-- ============================================================
DECLARE @tkVip    BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'vip@gmail.com');
DECLARE @tkMember BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'member@gmail.com');
DECLARE @tkKH1    BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'khach1@gmail.com');
DECLARE @tkKH2    BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'khach2@gmail.com');

IF @tkVip IS NOT NULL AND NOT EXISTS (SELECT 1 FROM diem_thuong WHERE tai_khoan_id=@tkVip)
  INSERT INTO diem_thuong(tai_khoan_id,so_diem) VALUES(@tkVip, 2500);
IF @tkMember IS NOT NULL AND NOT EXISTS (SELECT 1 FROM diem_thuong WHERE tai_khoan_id=@tkMember)
  INSERT INTO diem_thuong(tai_khoan_id,so_diem) VALUES(@tkMember, 850);
IF @tkKH1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM diem_thuong WHERE tai_khoan_id=@tkKH1)
  INSERT INTO diem_thuong(tai_khoan_id,so_diem) VALUES(@tkKH1, 320);
IF @tkKH2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM diem_thuong WHERE tai_khoan_id=@tkKH2)
  INSERT INTO diem_thuong(tai_khoan_id,so_diem) VALUES(@tkKH2, 0);
GO

-- ============================================================
-- LỊCH SỬ ĐIỂM THƯỞNG (mẫu)
-- ============================================================
DECLARE @tkVip BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'vip@gmail.com');
IF @tkVip IS NOT NULL AND NOT EXISTS (SELECT 1 FROM lich_su_diem_thuong WHERE tai_khoan_id=@tkVip) BEGIN
  INSERT INTO lich_su_diem_thuong(tai_khoan_id,loai_bien_dong,so_diem,ly_do,so_du_sau,tao_luc)
  VALUES(@tkVip,N'CONG',1000,N'Đặt vé suất chiếu phim Lật Mặt 7',1000,DATEADD(DAY,-60,SYSUTCDATETIME()));
  INSERT INTO lich_su_diem_thuong(tai_khoan_id,loai_bien_dong,so_diem,ly_do,so_du_sau,tao_luc)
  VALUES(@tkVip,N'CONG',500,N'Đặt vé suất chiếu phim Dune 2',1500,DATEADD(DAY,-45,SYSUTCDATETIME()));
  INSERT INTO lich_su_diem_thuong(tai_khoan_id,loai_bien_dong,so_diem,ly_do,so_du_sau,tao_luc)
  VALUES(@tkVip,N'TRU',200,N'Đổi điểm giảm giá',1300,DATEADD(DAY,-30,SYSUTCDATETIME()));
  INSERT INTO lich_su_diem_thuong(tai_khoan_id,loai_bien_dong,so_diem,ly_do,so_du_sau,tao_luc)
  VALUES(@tkVip,N'CONG',1200,N'Đặt vé theo nhóm 4 người',2500,DATEADD(DAY,-7,SYSUTCDATETIME()));
END
GO

-- ============================================================
-- MÃ GIẢM GIÁ TEST
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM ma_giam_gia WHERE ma_code = N'TEST10')
  INSERT INTO ma_giam_gia(ma_code,ten_ma,loai_giam,gia_tri_giam,ap_dung_cho,so_lan_toi_da,da_su_dung,ngay_bat_dau,ngay_ket_thuc,trang_thai)
  VALUES(N'TEST10',N'Giảm 10% toàn hệ thống',N'PHAN_TRAM',10,N'TOAN_HE_THONG',500,0,
    DATEADD(DAY,-7,SYSUTCDATETIME()),DATEADD(DAY,60,SYSUTCDATETIME()),N'HOAT_DONG');

IF NOT EXISTS (SELECT 1 FROM ma_giam_gia WHERE ma_code = N'GIAM50K')
  INSERT INTO ma_giam_gia(ma_code,ten_ma,loai_giam,gia_tri_giam,ap_dung_cho,so_lan_toi_da,da_su_dung,ngay_bat_dau,ngay_ket_thuc,trang_thai)
  VALUES(N'GIAM50K',N'Giảm thẳng 50,000đ',N'TIEN_MAT',50000,N'TOAN_HE_THONG',100,0,
    DATEADD(DAY,-1,SYSUTCDATETIME()),DATEADD(DAY,30,SYSUTCDATETIME()),N'HOAT_DONG');

IF NOT EXISTS (SELECT 1 FROM ma_giam_gia WHERE ma_code = N'VIP20')
  INSERT INTO ma_giam_gia(ma_code,ten_ma,loai_giam,gia_tri_giam,ap_dung_cho,so_lan_toi_da,da_su_dung,ngay_bat_dau,ngay_ket_thuc,trang_thai)
  VALUES(N'VIP20',N'Ưu đãi VIP 20%',N'PHAN_TRAM',20,N'TOAN_HE_THONG',200,0,
    DATEADD(DAY,-1,SYSUTCDATETIME()),DATEADD(DAY,90,SYSUTCDATETIME()),N'HOAT_DONG');
GO

-- ============================================================
-- KIỂM TRA KẾT QUẢ
-- ============================================================
PRINT N'';
PRINT N'=== DANH SÁCH TÀI KHOẢN TEST ===';
PRINT N'';
PRINT N'Email                    | Mật khẩu   | Vai trò       | Thẻ TV';
PRINT N'-------------------------|------------|---------------|-------';
PRINT N'admin@cinema.vn          | Admin@123  | ADMIN         | —';
PRINT N'nhanvien1@cinema.vn      | Admin@123  | NHAN_VIEN     | —';
PRINT N'nhanvien2@cinema.vn      | Admin@123  | NHAN_VIEN     | —';
PRINT N'khach1@gmail.com         | Admin@123  | KHACH_HANG    | Thường';
PRINT N'khach2@gmail.com         | Admin@123  | KHACH_HANG    | —';
PRINT N'khach3@gmail.com         | Admin@123  | KHACH_HANG    | —';
PRINT N'vip@gmail.com            | Admin@123  | KHACH_HANG    | VIP (2500đ)';
PRINT N'member@gmail.com         | Admin@123  | KHACH_HANG    | Thường (850đ)';
PRINT N'';
PRINT N'=== MÃ GIẢM GIÁ TEST ===';
PRINT N'TEST10   — Giảm 10% toàn hệ thống';
PRINT N'GIAM50K  — Giảm thẳng 50,000đ';
PRINT N'VIP20    — Giảm 20% toàn hệ thống';
PRINT N'';
PRINT N'=== Hoàn thành ===';
GO
