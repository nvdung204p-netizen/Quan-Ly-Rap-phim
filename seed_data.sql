-- FILE: seed_data.sql
-- Dữ liệu mẫu cho hệ thống Quản lý rạp chiếu phim

-- 1. LOẠI GHẾ
INSERT INTO loai_ghe (ten_loai, phu_thu, mau_hien_thi) VALUES (N'Thường', 0, '#3b82f6');
INSERT INTO loai_ghe (ten_loai, phu_thu, mau_hien_thi) VALUES (N'VIP', 20000, '#f59e0b');
INSERT INTO loai_ghe (ten_loai, phu_thu, mau_hien_thi) VALUES (N'Đôi (Sweetbox)', 50000, '#ec4899');

-- 2. PHÒNG CHIẾU
INSERT INTO phong_chieu (ten_phong, loai_phong, suc_chua, trang_thai) VALUES (N'Phòng 1', N'2D', 100, 'HOAT_DONG');
INSERT INTO phong_chieu (ten_phong, loai_phong, suc_chua, trang_thai) VALUES (N'Phòng 2', N'3D / IMAX', 80, 'HOAT_DONG');
INSERT INTO phong_chieu (ten_phong, loai_phong, suc_chua, trang_thai) VALUES (N'Phòng VIP', N'Gold Class', 40, 'HOAT_DONG');

-- 3. LOẠI VÉ
INSERT INTO loai_ve (ten_loai, he_so) VALUES (N'Người lớn', 1.0);
INSERT INTO loai_ve (ten_loai, he_so) VALUES (N'Trẻ em (<13 tuổi)', 0.7);
INSERT INTO loai_ve (ten_loai, he_so) VALUES (N'Sinh viên', 0.8);

-- 4. PHƯƠNG THỨC THANH TOÁN
INSERT INTO phuong_thuc_thanh_toan (ten_phuong_thuc, ma_phuong_thuc, trang_thai) VALUES (N'Tiền mặt tại quầy', 'TIEN_MAT', 'HOAT_DONG');
INSERT INTO phuong_thuc_thanh_toan (ten_phuong_thuc, ma_phuong_thuc, trang_thai) VALUES (N'Chuyển khoản Ngân hàng', 'CHUYEN_KHOAN', 'HOAT_DONG');
INSERT INTO phuong_thuc_thanh_toan (ten_phuong_thuc, ma_phuong_thuc, trang_thai) VALUES (N'Ví điện tử (Momo/ZaloPay)', 'VI_DIEN_TU', 'HOAT_DONG');

-- 5. PHIM (Mẫu 5 phim)
INSERT INTO phim (ten_phim, mo_ta, thoi_luong_phut, ngay_khoi_chieu, poster_url, gioi_han_tuoi, trang_thai) 
VALUES (N'Thám Tử Lừng Danh Conan: Ngôi Sao Năm Cánh 1 Triệu Đô', N'Hành trình phá án kịch tính của Conan tại Hakodate.', 110, '2026-05-01', 'https://image.tmdb.org/t/p/w500/966m97_poster.jpg', 13, 'DANG_CHIEU');

INSERT INTO phim (ten_phim, mo_ta, thoi_luong_phut, ngay_khoi_chieu, poster_url, gioi_han_tuoi, trang_thai) 
VALUES (N'Hành Tinh Khỉ: Vương Quốc Mới', N'Nhiều năm sau triều đại của Caesar, một con khỉ trẻ bắt đầu hành trình đầy nguy hiểm.', 145, '2026-05-10', 'https://image.tmdb.org/t/p/w500/gKkl37_poster.jpg', 13, 'SAP_CHIEU');

INSERT INTO phim (ten_phim, mo_ta, thoi_luong_phut, ngay_khoi_chieu, poster_url, gioi_han_tuoi, trang_thai) 
VALUES (N'Doraemon: Bản Giao Hưởng Địa Cầu', N'Nhóm bạn Nobita cùng nhau bảo vệ âm nhạc và trái đất.', 115, '2026-05-15', 'https://image.tmdb.org/t/p/w500/dora_poster.jpg', 0, 'DANG_CHIEU');

INSERT INTO phim (ten_phim, mo_ta, thoi_luong_phut, ngay_khoi_chieu, poster_url, gioi_han_tuoi, trang_thai) 
VALUES (N'Lật Mặt 7: Một Điều Ước', N'Câu chuyện gia đình đầy cảm động của đạo diễn Lý Hải.', 120, '2026-04-26', 'https://image.tmdb.org/t/p/w500/lat_mat_7.jpg', 13, 'DANG_CHIEU');

INSERT INTO phim (ten_phim, mo_ta, thoi_luong_phut, ngay_khoi_chieu, poster_url, gioi_han_tuoi, trang_thai) 
VALUES (N'Vây Hãm: Kẻ Trừng Phạt', N'Ma Dong-seok trở lại với những cú đấm thép.', 109, '2026-04-26', 'https://image.tmdb.org/t/p/w500/vay_ham.jpg', 16, 'DANG_CHIEU');

-- 6. GHẾ MẪU (Cho Phòng 1 - 10 hàng x 10 cột)
-- Lưu ý: Bạn nên chạy script loop trong ứng dụng SQL Manager để tạo đủ ghế. Dưới đây là mẫu:
DECLARE @i INT = 1;
DECLARE @p1 INT = (SELECT TOP 1 phong_chieu_id FROM phong_chieu WHERE ten_phong = N'Phòng 1');
DECLARE @lg_t INT = (SELECT TOP 1 loai_ghe_id FROM loai_ghe WHERE ten_loai = N'Thường');
DECLARE @lg_v INT = (SELECT TOP 1 loai_ghe_id FROM loai_ghe WHERE ten_loai = N'VIP');

WHILE @i <= 100
BEGIN
    DECLARE @hang CHAR(1) = CHAR(65 + (@i-1)/10);
    DECLARE @cot INT = (@i-1)%10 + 1;
    DECLARE @ma NVARCHAR(5) = @hang + CAST(@cot AS NVARCHAR);
    DECLARE @lg INT = CASE WHEN @hang IN ('E', 'F', 'G') THEN @lg_v ELSE @lg_t END;
    
    INSERT INTO ghe (phong_chieu_id, loai_ghe_id, ma_ghe, hang_ghe, cot_ghe, trang_thai)
    VALUES (@p1, @lg, @ma, @hang, @cot, 'TRONG');
    
    SET @i = @i + 1;
END

-- 7. SUẤT CHIẾU MẪU (Cho ngày hôm nay và ngày mai)
DECLARE @phim1 INT = (SELECT TOP 1 phim_id FROM phim WHERE ten_phim LIKE N'%Conan%');
DECLARE @today DATE = CAST(GETDATE() AS DATE);

INSERT INTO suat_chieu (phim_id, phong_chieu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)
VALUES (@phim1, @p1, CAST(@today AS DATETIME) + ' 10:00:00', CAST(@today AS DATETIME) + ' 12:00:00', 'DANG_MO_BAN');

INSERT INTO suat_chieu (phim_id, phong_chieu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)
VALUES (@phim1, @p1, CAST(@today AS DATETIME) + ' 14:00:00', CAST(@today AS DATETIME) + ' 16:00:00', 'DANG_MO_BAN');

INSERT INTO suat_chieu (phim_id, phong_chieu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)
VALUES (@phim1, @p1, CAST(@today AS DATETIME) + ' 19:30:00', CAST(@today AS DATETIME) + ' 21:30:00', 'DANG_MO_BAN');

-- 8. GIÁ VÉ PHIM (Mẫu giá cơ bản cho phim Conan)
INSERT INTO gia_ve_phim (phim_id, gia_co_ban, ngay_ap_dung, trang_thai)
VALUES (@phim1, 80000, '2026-05-01', 'DANG_AP_DUNG');
