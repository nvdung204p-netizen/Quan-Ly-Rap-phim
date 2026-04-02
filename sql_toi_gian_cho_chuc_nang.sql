IF DB_ID(N'QuanLyRapChieuPhim') IS NULL CREATE DATABASE QuanLyRapChieuPhim;
GO

/* ===================== SEED DỮ LIỆU DEMO ĐẦY ĐỦ ===================== */
IF NOT EXISTS (SELECT 1 FROM loai_ghe WHERE ma_loai = N'VIP')
  INSERT INTO loai_ghe(ma_loai, ten_loai, he_so_gia) VALUES (N'VIP', N'Ghế VIP', 1.50);
IF NOT EXISTS (SELECT 1 FROM loai_ghe WHERE ma_loai = N'DOI')
  INSERT INTO loai_ghe(ma_loai, ten_loai, he_so_gia) VALUES (N'DOI', N'Ghế đôi', 1.80);

IF NOT EXISTS (SELECT 1 FROM loai_ve WHERE ma_loai = N'TRE_EM')
  INSERT INTO loai_ve(ma_loai, ten_loai, mo_ta) VALUES (N'TRE_EM', N'Vé trẻ em', N'Áp dụng cho khách dưới 12 tuổi.');
IF NOT EXISTS (SELECT 1 FROM loai_ve WHERE ma_loai = N'SINH_VIEN')
  INSERT INTO loai_ve(ma_loai, ten_loai, mo_ta) VALUES (N'SINH_VIEN', N'Vé sinh viên', N'Áp dụng khi xuất trình thẻ sinh viên còn hạn.');

IF NOT EXISTS (SELECT 1 FROM khung_gio WHERE ten_khung_gio = N'Sáng')
  INSERT INTO khung_gio(ten_khung_gio, gio_bat_dau, gio_ket_thuc) VALUES (N'Sáng', '08:00', '11:59');
IF NOT EXISTS (SELECT 1 FROM khung_gio WHERE ten_khung_gio = N'Chiều')
  INSERT INTO khung_gio(ten_khung_gio, gio_bat_dau, gio_ket_thuc) VALUES (N'Chiều', '12:00', '17:59');
IF NOT EXISTS (SELECT 1 FROM khung_gio WHERE ten_khung_gio = N'Tối')
  INSERT INTO khung_gio(ten_khung_gio, gio_bat_dau, gio_ket_thuc) VALUES (N'Tối', '18:00', '23:30');

IF NOT EXISTS (SELECT 1 FROM phim WHERE ten_phim = N'Lật Mặt 7: Một Điều Ước')
  INSERT INTO phim(ten_phim, the_loai, dao_dien, dien_vien, thoi_luong_phut, gioi_han_tuoi, ngay_khoi_chieu, ngon_ngu, poster_url, trang_thai)
  VALUES (
    N'Lật Mặt 7: Một Điều Ước',
    N'Tâm lý, Gia đình',
    N'Lý Hải',
    N'Thanh Hiền, Đinh Y Nhung, Trương Minh Cường',
    138,
    N'P',
    '2024-04-26',
    N'Tiếng Việt',
    N'/uploads/posters/lat-mat-7.jpg',
    N'DANG_CHIEU'
  );
IF NOT EXISTS (SELECT 1 FROM phim WHERE ten_phim = N'Mai')
  INSERT INTO phim(ten_phim, the_loai, dao_dien, dien_vien, thoi_luong_phut, gioi_han_tuoi, ngay_khoi_chieu, ngon_ngu, poster_url, trang_thai)
  VALUES (
    N'Mai',
    N'Tình cảm, Tâm lý',
    N'Trấn Thành',
    N'Phương Anh Đào, Tuấn Trần, Hồng Đào',
    131,
    N'T16',
    '2024-02-10',
    N'Tiếng Việt',
    N'/uploads/posters/mai.jpg',
    N'DANG_CHIEU'
  );
IF NOT EXISTS (SELECT 1 FROM phim WHERE ten_phim = N'Dune: Hành Tinh Cát - Phần Hai')
  INSERT INTO phim(ten_phim, the_loai, dao_dien, dien_vien, thoi_luong_phut, gioi_han_tuoi, ngay_khoi_chieu, ngon_ngu, poster_url, trang_thai)
  VALUES (
    N'Dune: Hành Tinh Cát - Phần Hai',
    N'Khoa học viễn tưởng, Phiêu lưu',
    N'Denis Villeneuve',
    N'Timothée Chalamet, Zendaya, Rebecca Ferguson',
    166,
    N'T13',
    '2024-03-01',
    N'Tiếng Anh (phụ đề Việt)',
    N'/uploads/posters/dune-2.jpg',
    N'DANG_CHIEU'
  );

DECLARE @phimLatMat BIGINT = (SELECT TOP 1 phim_id FROM phim WHERE ten_phim = N'Lật Mặt 7: Một Điều Ước');
DECLARE @phimMai BIGINT = (SELECT TOP 1 phim_id FROM phim WHERE ten_phim = N'Mai');
DECLARE @phimDune BIGINT = (SELECT TOP 1 phim_id FROM phim WHERE ten_phim = N'Dune: Hành Tinh Cát - Phần Hai');

IF @phimLatMat IS NOT NULL AND NOT EXISTS (SELECT 1 FROM gioi_thieu_phim WHERE phim_id = @phimLatMat)
  INSERT INTO gioi_thieu_phim(phim_id, noi_dung)
  VALUES (@phimLatMat, N'Một câu chuyện gia đình giàu cảm xúc, nơi tình thân được thử thách qua biến cố và lòng bao dung.');
IF @phimMai IS NOT NULL AND NOT EXISTS (SELECT 1 FROM gioi_thieu_phim WHERE phim_id = @phimMai)
  INSERT INTO gioi_thieu_phim(phim_id, noi_dung)
  VALUES (@phimMai, N'Bộ phim khai thác những góc khuất của tình yêu hiện đại, vừa sâu lắng vừa gần gũi.');
IF @phimDune IS NOT NULL AND NOT EXISTS (SELECT 1 FROM gioi_thieu_phim WHERE phim_id = @phimDune)
  INSERT INTO gioi_thieu_phim(phim_id, noi_dung)
  VALUES (@phimDune, N'Hành trình định mệnh của Paul Atreides giữa sa mạc Arrakis đầy hiểm nguy và chính trị.');

IF @phimLatMat IS NOT NULL AND NOT EXISTS (SELECT 1 FROM trailer_phim WHERE phim_id = @phimLatMat)
  INSERT INTO trailer_phim(phim_id, tieu_de, trailer_url, thu_tu_hien_thi)
  VALUES (@phimLatMat, N'Trailer chính thức', N'https://www.youtube.com/watch?v=latmat7-trailer', 1);
IF @phimMai IS NOT NULL AND NOT EXISTS (SELECT 1 FROM trailer_phim WHERE phim_id = @phimMai)
  INSERT INTO trailer_phim(phim_id, tieu_de, trailer_url, thu_tu_hien_thi)
  VALUES (@phimMai, N'Teaser cảm xúc', N'https://www.youtube.com/watch?v=mai-trailer', 1);
IF @phimDune IS NOT NULL AND NOT EXISTS (SELECT 1 FROM trailer_phim WHERE phim_id = @phimDune)
  INSERT INTO trailer_phim(phim_id, tieu_de, trailer_url, thu_tu_hien_thi)
  VALUES (@phimDune, N'Official Trailer 2', N'https://www.youtube.com/watch?v=dune2-trailer', 1);

IF @phimLatMat IS NOT NULL AND NOT EXISTS (SELECT 1 FROM phim_hot WHERE phim_id = @phimLatMat)
  INSERT INTO phim_hot(phim_id, thu_tu_hien_thi, tu_ngay, den_ngay) VALUES (@phimLatMat, 1, CAST(GETDATE() AS DATE), DATEADD(DAY, 30, CAST(GETDATE() AS DATE)));
IF @phimDune IS NOT NULL AND NOT EXISTS (SELECT 1 FROM phim_hot WHERE phim_id = @phimDune)
  INSERT INTO phim_hot(phim_id, thu_tu_hien_thi, tu_ngay, den_ngay) VALUES (@phimDune, 2, CAST(GETDATE() AS DATE), DATEADD(DAY, 30, CAST(GETDATE() AS DATE)));

IF NOT EXISTS (SELECT 1 FROM phong_chieu WHERE ma_phong = N'P02')
  INSERT INTO phong_chieu(ma_phong, ten_phong, so_hang, so_cot, suc_chua, trang_thai) VALUES (N'P02', N'Phòng 2', 6, 10, 60, N'HOAT_DONG');

DECLARE @p2 BIGINT = (SELECT TOP 1 phong_chieu_id FROM phong_chieu WHERE ma_phong = N'P02');
DECLARE @lgVip INT = (SELECT TOP 1 loai_ghe_id FROM loai_ghe WHERE ma_loai = N'VIP');
IF @p2 IS NOT NULL AND @lgVip IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ghe WHERE phong_chieu_id = @p2)
BEGIN
  DECLARE @r2 INT = 1;
  WHILE @r2 <= 6
  BEGIN
    DECLARE @c2 INT = 1;
    WHILE @c2 <= 10
    BEGIN
      INSERT INTO ghe(phong_chieu_id, loai_ghe_id, ma_ghe, hang_ghe, cot_ghe, trang_thai)
      VALUES (@p2, @lgVip, CONCAT(CHAR(64 + @r2), @c2), CHAR(64 + @r2), @c2, N'HOAT_DONG');
      SET @c2 += 1;
    END
    SET @r2 += 1;
  END
END

DECLARE @p1 BIGINT = (SELECT TOP 1 phong_chieu_id FROM phong_chieu WHERE ma_phong = N'P01');
DECLARE @lgid INT = (SELECT TOP 1 loai_ghe_id FROM loai_ghe WHERE ma_loai = N'THUONG');
IF @phimLatMat IS NOT NULL AND @p1 IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM suat_chieu WHERE phim_id = @phimLatMat AND phong_chieu_id = @p1 AND thoi_gian_bat_dau = DATEADD(HOUR, 2, SYSUTCDATETIME())
)
  INSERT INTO suat_chieu(phim_id, phong_chieu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)
  VALUES (@phimLatMat, @p1, DATEADD(HOUR, 2, SYSUTCDATETIME()), DATEADD(MINUTE, 140, DATEADD(HOUR, 2, SYSUTCDATETIME())), N'DANG_MO_BAN');
IF @phimDune IS NOT NULL AND @p2 IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM suat_chieu WHERE phim_id = @phimDune AND phong_chieu_id = @p2 AND thoi_gian_bat_dau = DATEADD(HOUR, 5, SYSUTCDATETIME())
)
  INSERT INTO suat_chieu(phim_id, phong_chieu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)
  VALUES (@phimDune, @p2, DATEADD(HOUR, 5, SYSUTCDATETIME()), DATEADD(MINUTE, 170, DATEADD(HOUR, 5, SYSUTCDATETIME())), N'DANG_MO_BAN');

IF @phimLatMat IS NOT NULL AND NOT EXISTS (SELECT 1 FROM gia_ve_phim WHERE phim_id = @phimLatMat AND tu_ngay = CAST(GETDATE() AS DATE))
  INSERT INTO gia_ve_phim(phim_id, gia_co_ban, tu_ngay, den_ngay) VALUES (@phimLatMat, 90000, CAST(GETDATE() AS DATE), NULL);
IF @phimDune IS NOT NULL AND NOT EXISTS (SELECT 1 FROM gia_ve_phim WHERE phim_id = @phimDune AND tu_ngay = CAST(GETDATE() AS DATE))
  INSERT INTO gia_ve_phim(phim_id, gia_co_ban, tu_ngay, den_ngay) VALUES (@phimDune, 110000, CAST(GETDATE() AS DATE), NULL);

DECLARE @kgToi INT = (SELECT TOP 1 khung_gio_id FROM khung_gio WHERE ten_khung_gio = N'Tối');
IF @phimLatMat IS NOT NULL AND @kgToi IS NOT NULL AND NOT EXISTS (SELECT 1 FROM gia_ve_theo_khung_gio WHERE phim_id = @phimLatMat AND khung_gio_id = @kgToi AND tu_ngay = CAST(GETDATE() AS DATE))
  INSERT INTO gia_ve_theo_khung_gio(phim_id, khung_gio_id, gia_ve, tu_ngay, den_ngay)
  VALUES (@phimLatMat, @kgToi, 100000, CAST(GETDATE() AS DATE), NULL);

IF @phimLatMat IS NOT NULL AND @p1 IS NOT NULL AND @lgid IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM gia_ve_theo_loai_ghe WHERE phim_id = @phimLatMat AND phong_chieu_id = @p1 AND loai_ghe_id = @lgid AND tu_ngay = CAST(GETDATE() AS DATE)
)
  INSERT INTO gia_ve_theo_loai_ghe(phim_id, phong_chieu_id, loai_ghe_id, gia_ve, tu_ngay, den_ngay)
  VALUES (@phimLatMat, @p1, @lgid, 95000, CAST(GETDATE() AS DATE), NULL);

IF @phimLatMat IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ma_giam_gia WHERE ma_code = N'KHAITRUONG20')
  INSERT INTO ma_giam_gia(ma_code, ten_ma, loai_giam, gia_tri_giam, ap_dung_cho, phim_id, so_lan_toi_da, da_su_dung, ngay_bat_dau, ngay_ket_thuc, trang_thai)
  VALUES (N'KHAITRUONG20', N'Khai trương giảm 20%', N'PHAN_TRAM', 20, N'TOAN_HE_THONG', NULL, 1000, 0, DATEADD(DAY, -7, SYSUTCDATETIME()), DATEADD(DAY, 30, SYSUTCDATETIME()), N'HOAT_DONG');
IF @phimDune IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ma_giam_gia WHERE ma_code = N'DUNE50K')
  INSERT INTO ma_giam_gia(ma_code, ten_ma, loai_giam, gia_tri_giam, ap_dung_cho, phim_id, so_lan_toi_da, da_su_dung, ngay_bat_dau, ngay_ket_thuc, trang_thai)
  VALUES (N'DUNE50K', N'Ưu đãi Dune 50K', N'TIEN_MAT', 50000, N'THEO_PHIM', @phimDune, 300, 0, DATEADD(DAY, -3, SYSUTCDATETIME()), DATEADD(DAY, 15, SYSUTCDATETIME()), N'HOAT_DONG');

IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE email = N'admin.demo@cinema.vn')
  INSERT INTO tai_khoan(email, so_dien_thoai, mat_khau_hash, ho_ten, trang_thai, tao_luc, cap_nhat_luc)
  VALUES (N'admin.demo@cinema.vn', N'0901000001', N'100000.7rNZRWnaqxVH/jQB9Kxevg==.0qN8inWgAngrQiWmO5ZIW2iIvruhkgslMXn9mMuXsZw=', N'Nguyễn Quản Trị', N'HOAT_DONG', SYSUTCDATETIME(), SYSUTCDATETIME());
IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE email = N'nhanvien.demo@cinema.vn')
  INSERT INTO tai_khoan(email, so_dien_thoai, mat_khau_hash, ho_ten, trang_thai, tao_luc, cap_nhat_luc)
  VALUES (N'nhanvien.demo@cinema.vn', N'0901000002', N'100000.7rNZRWnaqxVH/jQB9Kxevg==.0qN8inWgAngrQiWmO5ZIW2iIvruhkgslMXn9mMuXsZw=', N'Trần Nhân Viên', N'HOAT_DONG', SYSUTCDATETIME(), SYSUTCDATETIME());
IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE email = N'khach.demo@cinema.vn')
  INSERT INTO tai_khoan(email, so_dien_thoai, mat_khau_hash, ho_ten, trang_thai, tao_luc, cap_nhat_luc)
  VALUES (N'khach.demo@cinema.vn', N'0901000003', N'100000.7rNZRWnaqxVH/jQB9Kxevg==.0qN8inWgAngrQiWmO5ZIW2iIvruhkgslMXn9mMuXsZw=', N'Lê Khách Hàng', N'HOAT_DONG', SYSUTCDATETIME(), SYSUTCDATETIME());

DECLARE @vtAdmin INT = (SELECT TOP 1 vai_tro_id FROM vai_tro WHERE ma_vai_tro = N'ADMIN');
DECLARE @vtNhanVien INT = (SELECT TOP 1 vai_tro_id FROM vai_tro WHERE ma_vai_tro = N'NHAN_VIEN');
DECLARE @vtKhach INT = (SELECT TOP 1 vai_tro_id FROM vai_tro WHERE ma_vai_tro = N'KHACH_HANG');
DECLARE @tkAdmin BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'admin.demo@cinema.vn');
DECLARE @tkNhanVien BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'nhanvien.demo@cinema.vn');
DECLARE @tkKhach BIGINT = (SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email = N'khach.demo@cinema.vn');

IF @tkAdmin IS NOT NULL AND @vtAdmin IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tai_khoan_vai_tro WHERE tai_khoan_id = @tkAdmin AND vai_tro_id = @vtAdmin)
  INSERT INTO tai_khoan_vai_tro(tai_khoan_id, vai_tro_id, tao_luc) VALUES (@tkAdmin, @vtAdmin, SYSUTCDATETIME());
IF @tkNhanVien IS NOT NULL AND @vtNhanVien IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tai_khoan_vai_tro WHERE tai_khoan_id = @tkNhanVien AND vai_tro_id = @vtNhanVien)
  INSERT INTO tai_khoan_vai_tro(tai_khoan_id, vai_tro_id, tao_luc) VALUES (@tkNhanVien, @vtNhanVien, SYSUTCDATETIME());
IF @tkKhach IS NOT NULL AND @vtKhach IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tai_khoan_vai_tro WHERE tai_khoan_id = @tkKhach AND vai_tro_id = @vtKhach)
  INSERT INTO tai_khoan_vai_tro(tai_khoan_id, vai_tro_id, tao_luc) VALUES (@tkKhach, @vtKhach, SYSUTCDATETIME());

IF @tkKhach IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ma_xac_thuc_otp WHERE email = N'khach.demo@cinema.vn' AND muc_dich = N'QUEN_MAT_KHAU')
  INSERT INTO ma_xac_thuc_otp(tai_khoan_id, email, so_dien_thoai, ma_otp, muc_dich, het_han_luc, da_su_dung, tao_luc)
  VALUES (@tkKhach, N'khach.demo@cinema.vn', N'0901000003', N'123456', N'QUEN_MAT_KHAU', DATEADD(MINUTE, 10, SYSUTCDATETIME()), 0, SYSUTCDATETIME());

DECLARE @scDemo BIGINT = (SELECT TOP 1 suat_chieu_id FROM suat_chieu ORDER BY suat_chieu_id);
DECLARE @gheDemo BIGINT = (
  SELECT TOP 1 g.ghe_id
  FROM ghe g
  JOIN phong_chieu pc ON pc.phong_chieu_id = g.phong_chieu_id
  WHERE pc.ma_phong = N'P01' AND g.ma_ghe = N'A1'
);
DECLARE @lvThuong INT = (SELECT TOP 1 loai_ve_id FROM loai_ve WHERE ma_loai = N'THUONG');

IF @tkKhach IS NOT NULL AND NOT EXISTS (SELECT 1 FROM don_dat_ve WHERE ma_don = N'DV_DEMO_0001')
  INSERT INTO don_dat_ve(tai_khoan_id, ma_don, tong_tien_goc, tong_giam, tong_thanh_toan, trang_thai, kenh_dat, tao_luc)
  VALUES (@tkKhach, N'DV_DEMO_0001', 95000, 20000, 75000, N'DA_THANH_TOAN', N'ONLINE', SYSUTCDATETIME());

DECLARE @donDemo BIGINT = (SELECT TOP 1 don_dat_ve_id FROM don_dat_ve WHERE ma_don = N'DV_DEMO_0001');
DECLARE @mggDemo BIGINT = (SELECT TOP 1 ma_giam_gia_id FROM ma_giam_gia WHERE ma_code = N'KHAITRUONG20');
DECLARE @ptttCK INT = (SELECT TOP 1 phuong_thuc_thanh_toan_id FROM phuong_thuc_thanh_toan WHERE ma_phuong_thuc = N'CHUYEN_KHOAN');

IF @donDemo IS NOT NULL AND @scDemo IS NOT NULL AND @gheDemo IS NOT NULL AND @lvThuong IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ve WHERE ma_qr_ve = N'QR_DV_DEMO_0001_A1')
  INSERT INTO ve(don_dat_ve_id, suat_chieu_id, ghe_id, loai_ve_id, gia_ve, ma_qr_ve, da_checkin, checkin_luc, trang_thai)
  VALUES (@donDemo, @scDemo, @gheDemo, @lvThuong, 95000, N'QR_DV_DEMO_0001_A1', 0, NULL, N'HOP_LE');

IF @mggDemo IS NOT NULL AND @donDemo IS NOT NULL AND @tkKhach IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM su_dung_ma_giam_gia WHERE ma_giam_gia_id = @mggDemo AND don_dat_ve_id = @donDemo)
  INSERT INTO su_dung_ma_giam_gia(ma_giam_gia_id, don_dat_ve_id, tai_khoan_id, so_tien_giam, tao_luc)
  VALUES (@mggDemo, @donDemo, @tkKhach, 20000, SYSUTCDATETIME());

IF @donDemo IS NOT NULL AND @ptttCK IS NOT NULL AND NOT EXISTS (SELECT 1 FROM thanh_toan WHERE don_dat_ve_id = @donDemo)
  INSERT INTO thanh_toan(don_dat_ve_id, phuong_thuc_thanh_toan_id, so_tien, ma_giao_dich, trang_thai, thanh_toan_luc)
  VALUES (@donDemo, @ptttCK, 75000, N'GD_DEMO_0001', N'THANH_CONG', SYSUTCDATETIME());

IF NOT EXISTS (SELECT 1 FROM su_kien WHERE tieu_de = N'Ưu đãi Thứ Ba Vui Vẻ')
  INSERT INTO su_kien(tieu_de, mo_ta_ngan, noi_dung, anh_dai_dien_url, hien_thi_trang_chu, ngay_bat_dau, ngay_ket_thuc, trang_thai, tao_luc)
  VALUES (
    N'Ưu đãi Thứ Ba Vui Vẻ',
    N'Đồng giá vé 55.000đ cho mọi suất chiếu trước 17:00 vào thứ Ba hằng tuần.',
    N'Khán giả mua vé trực tiếp hoặc online đều được áp dụng. Không áp dụng đồng thời với mã giảm giá khác, trừ khi có thông báo riêng.',
    N'/uploads/events/uu-dai-thu-ba.jpg',
    1,
    DATEADD(DAY, -1, SYSUTCDATETIME()),
    DATEADD(DAY, 60, SYSUTCDATETIME()),
    N'HOAT_DONG',
    SYSUTCDATETIME()
  );
IF NOT EXISTS (SELECT 1 FROM su_kien WHERE tieu_de = N'Combo Bắp Nước Siêu Tiết Kiệm')
  INSERT INTO su_kien(tieu_de, mo_ta_ngan, noi_dung, anh_dai_dien_url, hien_thi_trang_chu, ngay_bat_dau, ngay_ket_thuc, trang_thai, tao_luc)
  VALUES (
    N'Combo Bắp Nước Siêu Tiết Kiệm',
    N'Mua combo bắp lớn + 2 nước chỉ với 89.000đ.',
    N'Áp dụng tại quầy cho tất cả khách hàng thành viên. Số lượng có hạn trong ngày cuối tuần.',
    N'/uploads/events/combo-bap-nuoc.jpg',
    1,
    DATEADD(DAY, -3, SYSUTCDATETIME()),
    DATEADD(DAY, 45, SYSUTCDATETIME()),
    N'HOAT_DONG',
    SYSUTCDATETIME()
  );
GO
USE QuanLyRapChieuPhim;
GO

IF OBJECT_ID(N'vai_tro', N'U') IS NULL
CREATE TABLE vai_tro (
  vai_tro_id INT IDENTITY(1,1) PRIMARY KEY,
  ma_vai_tro NVARCHAR(50) NOT NULL UNIQUE,
  ten_vai_tro NVARCHAR(100) NOT NULL
);
GO
IF OBJECT_ID(N'tai_khoan', N'U') IS NULL
CREATE TABLE tai_khoan (
  tai_khoan_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  email NVARCHAR(255) NULL UNIQUE,
  so_dien_thoai NVARCHAR(20) NULL UNIQUE,
  mat_khau_hash NVARCHAR(500) NOT NULL,
  ho_ten NVARCHAR(255) NOT NULL,
  trang_thai NVARCHAR(30) NOT NULL DEFAULT N'HOAT_DONG',
  tao_luc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  cap_nhat_luc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF OBJECT_ID(N'tai_khoan_vai_tro', N'U') IS NULL
CREATE TABLE tai_khoan_vai_tro (
  tai_khoan_vai_tro_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  tai_khoan_id BIGINT NOT NULL,
  vai_tro_id INT NOT NULL,
  tao_luc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT uq_tkvt UNIQUE (tai_khoan_id, vai_tro_id),
  CONSTRAINT fk_tkvt_tk FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id),
  CONSTRAINT fk_tkvt_vt FOREIGN KEY (vai_tro_id) REFERENCES vai_tro(vai_tro_id)
);
GO
IF OBJECT_ID(N'ma_xac_thuc_otp', N'U') IS NULL
CREATE TABLE ma_xac_thuc_otp (
  ma_xac_thuc_otp_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  tai_khoan_id BIGINT NULL,
  email NVARCHAR(255) NULL,
  so_dien_thoai NVARCHAR(20) NULL,
  ma_otp NVARCHAR(20) NOT NULL,
  muc_dich NVARCHAR(50) NOT NULL,
  het_han_luc DATETIME2 NOT NULL,
  da_su_dung BIT NOT NULL DEFAULT 0,
  tao_luc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_otp_tk FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id)
);
GO

IF OBJECT_ID(N'phim', N'U') IS NULL
CREATE TABLE phim (
  phim_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ten_phim NVARCHAR(255) NOT NULL,
  the_loai NVARCHAR(255) NULL,
  dao_dien NVARCHAR(255) NULL,
  dien_vien NVARCHAR(MAX) NULL,
  thoi_luong_phut INT NULL,
  gioi_han_tuoi NVARCHAR(20) NULL,
  ngay_khoi_chieu DATE NULL,
  ngon_ngu NVARCHAR(100) NULL,
  poster_url NVARCHAR(500) NULL,
  trang_thai NVARCHAR(30) NOT NULL DEFAULT N'SAP_CHIEU',
  tao_luc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  cap_nhat_luc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF OBJECT_ID(N'gioi_thieu_phim', N'U') IS NULL
CREATE TABLE gioi_thieu_phim (
  gioi_thieu_phim_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  phim_id BIGINT NOT NULL,
  noi_dung NVARCHAR(MAX) NOT NULL,
  tao_luc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  cap_nhat_luc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_gtp_phim FOREIGN KEY (phim_id) REFERENCES phim(phim_id)
);
GO
IF OBJECT_ID(N'trailer_phim', N'U') IS NULL
CREATE TABLE trailer_phim (
  trailer_phim_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  phim_id BIGINT NOT NULL,
  tieu_de NVARCHAR(255) NULL,
  trailer_url NVARCHAR(500) NOT NULL,
  thu_tu_hien_thi INT NOT NULL DEFAULT 1,
  tao_luc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_tp_phim FOREIGN KEY (phim_id) REFERENCES phim(phim_id)
);
GO
IF OBJECT_ID(N'phim_hot', N'U') IS NULL
CREATE TABLE phim_hot (
  phim_hot_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  phim_id BIGINT NOT NULL UNIQUE,
  thu_tu_hien_thi INT NOT NULL DEFAULT 1,
  tu_ngay DATE NULL,
  den_ngay DATE NULL,
  CONSTRAINT fk_ph_phim FOREIGN KEY (phim_id) REFERENCES phim(phim_id)
);
GO

IF OBJECT_ID(N'loai_ghe', N'U') IS NULL
CREATE TABLE loai_ghe (
  loai_ghe_id INT IDENTITY(1,1) PRIMARY KEY,
  ma_loai NVARCHAR(50) NOT NULL UNIQUE,
  ten_loai NVARCHAR(100) NOT NULL,
  he_so_gia DECIMAL(10,2) NOT NULL DEFAULT 1
);
GO
IF OBJECT_ID(N'phong_chieu', N'U') IS NULL
CREATE TABLE phong_chieu (
  phong_chieu_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ma_phong NVARCHAR(50) NOT NULL UNIQUE,
  ten_phong NVARCHAR(100) NOT NULL,
  so_hang INT NOT NULL,
  so_cot INT NOT NULL,
  suc_chua INT NOT NULL,
  trang_thai NVARCHAR(30) NOT NULL DEFAULT N'HOAT_DONG'
);
GO
IF OBJECT_ID(N'ghe', N'U') IS NULL
CREATE TABLE ghe (
  ghe_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  phong_chieu_id BIGINT NOT NULL,
  loai_ghe_id INT NOT NULL,
  ma_ghe NVARCHAR(20) NOT NULL,
  hang_ghe NVARCHAR(10) NOT NULL,
  cot_ghe INT NOT NULL,
  trang_thai NVARCHAR(30) NOT NULL DEFAULT N'HOAT_DONG',
  CONSTRAINT uq_ghe UNIQUE (phong_chieu_id, ma_ghe),
  CONSTRAINT fk_ghe_pc FOREIGN KEY (phong_chieu_id) REFERENCES phong_chieu(phong_chieu_id),
  CONSTRAINT fk_ghe_lg FOREIGN KEY (loai_ghe_id) REFERENCES loai_ghe(loai_ghe_id)
);
GO
IF OBJECT_ID(N'suat_chieu', N'U') IS NULL
CREATE TABLE suat_chieu (
  suat_chieu_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  phim_id BIGINT NOT NULL,
  phong_chieu_id BIGINT NOT NULL,
  thoi_gian_bat_dau DATETIME2 NOT NULL,
  thoi_gian_ket_thuc DATETIME2 NOT NULL,
  trang_thai NVARCHAR(30) NOT NULL DEFAULT N'DANG_MO_BAN',
  CONSTRAINT fk_sc_p FOREIGN KEY (phim_id) REFERENCES phim(phim_id),
  CONSTRAINT fk_sc_pc FOREIGN KEY (phong_chieu_id) REFERENCES phong_chieu(phong_chieu_id)
);
GO

IF OBJECT_ID(N'khung_gio', N'U') IS NULL
CREATE TABLE khung_gio (
  khung_gio_id INT IDENTITY(1,1) PRIMARY KEY,
  ten_khung_gio NVARCHAR(100) NOT NULL,
  gio_bat_dau TIME NOT NULL,
  gio_ket_thuc TIME NOT NULL
);
GO
IF OBJECT_ID(N'gia_ve_phim', N'U') IS NULL
CREATE TABLE gia_ve_phim (
  gia_ve_phim_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  phim_id BIGINT NOT NULL,
  gia_co_ban DECIMAL(18,2) NOT NULL,
  tu_ngay DATE NOT NULL,
  den_ngay DATE NULL,
  CONSTRAINT fk_gvp_p FOREIGN KEY (phim_id) REFERENCES phim(phim_id)
);
GO
IF OBJECT_ID(N'gia_ve_theo_loai_ghe', N'U') IS NULL
CREATE TABLE gia_ve_theo_loai_ghe (
  gia_ve_theo_loai_ghe_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  phim_id BIGINT NOT NULL,
  phong_chieu_id BIGINT NOT NULL,
  loai_ghe_id INT NOT NULL,
  gia_ve DECIMAL(18,2) NOT NULL,
  tu_ngay DATE NOT NULL,
  den_ngay DATE NULL,
  CONSTRAINT fk_gvlg_p FOREIGN KEY (phim_id) REFERENCES phim(phim_id),
  CONSTRAINT fk_gvlg_pc FOREIGN KEY (phong_chieu_id) REFERENCES phong_chieu(phong_chieu_id),
  CONSTRAINT fk_gvlg_lg FOREIGN KEY (loai_ghe_id) REFERENCES loai_ghe(loai_ghe_id)
);
GO
IF OBJECT_ID(N'gia_ve_theo_khung_gio', N'U') IS NULL
CREATE TABLE gia_ve_theo_khung_gio (
  gia_ve_theo_khung_gio_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  phim_id BIGINT NOT NULL,
  khung_gio_id INT NOT NULL,
  gia_ve DECIMAL(18,2) NOT NULL,
  tu_ngay DATE NOT NULL,
  den_ngay DATE NULL,
  CONSTRAINT fk_gvkg_p FOREIGN KEY (phim_id) REFERENCES phim(phim_id),
  CONSTRAINT fk_gvkg_kg FOREIGN KEY (khung_gio_id) REFERENCES khung_gio(khung_gio_id)
);
GO

IF OBJECT_ID(N'loai_ve', N'U') IS NULL
CREATE TABLE loai_ve (
  loai_ve_id INT IDENTITY(1,1) PRIMARY KEY,
  ma_loai NVARCHAR(50) NOT NULL UNIQUE,
  ten_loai NVARCHAR(100) NOT NULL,
  mo_ta NVARCHAR(255) NULL
);
GO
IF OBJECT_ID(N'ma_giam_gia', N'U') IS NULL
CREATE TABLE ma_giam_gia (
  ma_giam_gia_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ma_code NVARCHAR(50) NOT NULL UNIQUE,
  ten_ma NVARCHAR(255) NOT NULL,
  loai_giam NVARCHAR(30) NOT NULL,
  gia_tri_giam DECIMAL(18,2) NOT NULL,
  ap_dung_cho NVARCHAR(50) NOT NULL,
  phim_id BIGINT NULL,
  so_lan_toi_da INT NULL,
  da_su_dung INT NOT NULL DEFAULT 0,
  ngay_bat_dau DATETIME2 NOT NULL,
  ngay_ket_thuc DATETIME2 NOT NULL,
  trang_thai NVARCHAR(30) NOT NULL DEFAULT N'HOAT_DONG',
  CONSTRAINT fk_mgg_p FOREIGN KEY (phim_id) REFERENCES phim(phim_id)
);
GO
IF OBJECT_ID(N'don_dat_ve', N'U') IS NULL
CREATE TABLE don_dat_ve (
  don_dat_ve_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  tai_khoan_id BIGINT NULL,
  ma_don NVARCHAR(100) NOT NULL UNIQUE,
  tong_tien_goc DECIMAL(18,2) NOT NULL,
  tong_giam DECIMAL(18,2) NOT NULL DEFAULT 0,
  tong_thanh_toan DECIMAL(18,2) NOT NULL,
  trang_thai NVARCHAR(30) NOT NULL DEFAULT N'CHO_THANH_TOAN',
  kenh_dat NVARCHAR(30) NOT NULL DEFAULT N'ONLINE',
  tao_luc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_ddv_tk FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id)
);
GO
IF OBJECT_ID(N've', N'U') IS NULL
CREATE TABLE ve (
  ve_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  don_dat_ve_id BIGINT NOT NULL,
  suat_chieu_id BIGINT NOT NULL,
  ghe_id BIGINT NOT NULL,
  loai_ve_id INT NOT NULL,
  gia_ve DECIMAL(18,2) NOT NULL,
  ma_qr_ve NVARCHAR(200) NULL UNIQUE,
  da_checkin BIT NOT NULL DEFAULT 0,
  checkin_luc DATETIME2 NULL,
  trang_thai NVARCHAR(30) NOT NULL DEFAULT N'HOP_LE',
  CONSTRAINT uq_ve_sc_ghe UNIQUE (suat_chieu_id, ghe_id),
  CONSTRAINT fk_ve_ddv FOREIGN KEY (don_dat_ve_id) REFERENCES don_dat_ve(don_dat_ve_id),
  CONSTRAINT fk_ve_sc FOREIGN KEY (suat_chieu_id) REFERENCES suat_chieu(suat_chieu_id),
  CONSTRAINT fk_ve_g FOREIGN KEY (ghe_id) REFERENCES ghe(ghe_id),
  CONSTRAINT fk_ve_lv FOREIGN KEY (loai_ve_id) REFERENCES loai_ve(loai_ve_id)
);
GO
IF OBJECT_ID(N'su_dung_ma_giam_gia', N'U') IS NULL
CREATE TABLE su_dung_ma_giam_gia (
  su_dung_ma_giam_gia_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ma_giam_gia_id BIGINT NOT NULL,
  don_dat_ve_id BIGINT NOT NULL,
  tai_khoan_id BIGINT NULL,
  so_tien_giam DECIMAL(18,2) NOT NULL,
  tao_luc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_sdmg_mg FOREIGN KEY (ma_giam_gia_id) REFERENCES ma_giam_gia(ma_giam_gia_id),
  CONSTRAINT fk_sdmg_ddv FOREIGN KEY (don_dat_ve_id) REFERENCES don_dat_ve(don_dat_ve_id),
  CONSTRAINT fk_sdmg_tk FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id)
);
GO
IF OBJECT_ID(N'phuong_thuc_thanh_toan', N'U') IS NULL
CREATE TABLE phuong_thuc_thanh_toan (
  phuong_thuc_thanh_toan_id INT IDENTITY(1,1) PRIMARY KEY,
  ma_phuong_thuc NVARCHAR(50) NOT NULL UNIQUE,
  ten_phuong_thuc NVARCHAR(100) NOT NULL
);
GO
IF OBJECT_ID(N'thanh_toan', N'U') IS NULL
CREATE TABLE thanh_toan (
  thanh_toan_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  don_dat_ve_id BIGINT NOT NULL,
  phuong_thuc_thanh_toan_id INT NOT NULL,
  so_tien DECIMAL(18,2) NOT NULL,
  ma_giao_dich NVARCHAR(100) NULL,
  trang_thai NVARCHAR(30) NOT NULL DEFAULT N'THANH_CONG',
  thanh_toan_luc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_tt_ddv FOREIGN KEY (don_dat_ve_id) REFERENCES don_dat_ve(don_dat_ve_id),
  CONSTRAINT fk_tt_pttt FOREIGN KEY (phuong_thuc_thanh_toan_id) REFERENCES phuong_thuc_thanh_toan(phuong_thuc_thanh_toan_id)
);
GO

IF OBJECT_ID(N'su_kien', N'U') IS NULL
CREATE TABLE su_kien (
  su_kien_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  tieu_de NVARCHAR(255) NOT NULL,
  mo_ta_ngan NVARCHAR(500) NULL,
  noi_dung NVARCHAR(MAX) NULL,
  anh_dai_dien_url NVARCHAR(500) NULL,
  hien_thi_trang_chu BIT NOT NULL DEFAULT 0,
  ngay_bat_dau DATETIME2 NULL,
  ngay_ket_thuc DATETIME2 NULL,
  trang_thai NVARCHAR(30) NOT NULL DEFAULT N'HOAT_DONG',
  tao_luc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF NOT EXISTS (SELECT 1 FROM vai_tro WHERE ma_vai_tro = N'ADMIN') INSERT INTO vai_tro(ma_vai_tro, ten_vai_tro) VALUES (N'ADMIN', N'Quan tri');
IF NOT EXISTS (SELECT 1 FROM vai_tro WHERE ma_vai_tro = N'NHAN_VIEN') INSERT INTO vai_tro(ma_vai_tro, ten_vai_tro) VALUES (N'NHAN_VIEN', N'Nhan vien');
IF NOT EXISTS (SELECT 1 FROM vai_tro WHERE ma_vai_tro = N'KHACH_HANG') INSERT INTO vai_tro(ma_vai_tro, ten_vai_tro) VALUES (N'KHACH_HANG', N'Khach hang');
IF NOT EXISTS (SELECT 1 FROM loai_ve WHERE ma_loai = N'THUONG') INSERT INTO loai_ve(ma_loai, ten_loai, mo_ta) VALUES (N'THUONG', N'Ve thuong', N'Mac dinh');
IF NOT EXISTS (SELECT 1 FROM phuong_thuc_thanh_toan WHERE ma_phuong_thuc = N'TIEN_MAT') INSERT INTO phuong_thuc_thanh_toan(ma_phuong_thuc, ten_phuong_thuc) VALUES (N'TIEN_MAT', N'Tien mat');
IF NOT EXISTS (SELECT 1 FROM phuong_thuc_thanh_toan WHERE ma_phuong_thuc = N'CHUYEN_KHOAN') INSERT INTO phuong_thuc_thanh_toan(ma_phuong_thuc, ten_phuong_thuc) VALUES (N'CHUYEN_KHOAN', N'Chuyen khoan');
IF NOT EXISTS (SELECT 1 FROM phuong_thuc_thanh_toan WHERE ma_phuong_thuc = N'VI_DIEN_TU') INSERT INTO phuong_thuc_thanh_toan(ma_phuong_thuc, ten_phuong_thuc) VALUES (N'VI_DIEN_TU', N'Vi dien tu');
IF NOT EXISTS (SELECT 1 FROM loai_ghe WHERE ma_loai = N'THUONG') INSERT INTO loai_ghe(ma_loai, ten_loai, he_so_gia) VALUES (N'THUONG', N'Ghe thuong', 1.0);
IF NOT EXISTS (SELECT 1 FROM phong_chieu WHERE ma_phong = N'P01') INSERT INTO phong_chieu(ma_phong, ten_phong, so_hang, so_cot, suc_chua, trang_thai) VALUES (N'P01', N'Phong 1', 5, 8, 40, N'HOAT_DONG');
GO

DECLARE @pid BIGINT = (SELECT TOP 1 phong_chieu_id FROM phong_chieu WHERE ma_phong = N'P01');
DECLARE @lgid INT = (SELECT TOP 1 loai_ghe_id FROM loai_ghe WHERE ma_loai = N'THUONG');
IF @pid IS NOT NULL AND @lgid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ghe WHERE phong_chieu_id = @pid)
BEGIN
  DECLARE @r INT = 1;
  WHILE @r <= 5
  BEGIN
    DECLARE @c INT = 1;
    WHILE @c <= 8
    BEGIN
      INSERT INTO ghe(phong_chieu_id, loai_ghe_id, ma_ghe, hang_ghe, cot_ghe, trang_thai)
      VALUES (@pid, @lgid, CONCAT(CHAR(64 + @r), @c), CHAR(64 + @r), @c, N'HOAT_DONG');
      SET @c += 1;
    END
    SET @r += 1;
  END
END
GO
