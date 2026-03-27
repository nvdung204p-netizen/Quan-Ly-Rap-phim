-- =========================================================
-- CSDL QUAN LY RAP CHIEU PHIM (SQL Server)
-- FE: ReactJS | BE: C#
-- Luu y:
-- 1) Ten bang/cot dung tieng Viet khong dau de de query.
-- 2) Dung NVARCHAR de ho tro tieng Viet co dau trong du lieu.
-- =========================================================

-- Tao CSDL (tuy chon)
IF DB_ID(N'QuanLyRapChieuPhim') IS NULL
BEGIN
    CREATE DATABASE QuanLyRapChieuPhim;
END
GO

USE QuanLyRapChieuPhim;
GO

-- =========================================================
-- 1) Danh muc chung
-- =========================================================

CREATE TABLE vai_tro (
    vai_tro_id INT IDENTITY(1,1) PRIMARY KEY,
    ma_vai_tro NVARCHAR(30) NOT NULL UNIQUE, -- ADMIN, NHAN_VIEN, KHACH_HANG
    ten_vai_tro NVARCHAR(100) NOT NULL
);
GO

CREATE TABLE loai_thanh_vien (
    loai_thanh_vien_id INT IDENTITY(1,1) PRIMARY KEY,
    ma_loai NVARCHAR(30) NOT NULL UNIQUE, -- KHONG_DANG_KY, THUONG, VIP
    ten_loai NVARCHAR(100) NOT NULL,
    phan_tram_giam DECIMAL(5,2) NOT NULL DEFAULT(0), -- 10, 20...
    uu_dai_mo_ta NVARCHAR(500) NULL
);
GO

CREATE TABLE loai_ghe (
    loai_ghe_id INT IDENTITY(1,1) PRIMARY KEY,
    ma_loai NVARCHAR(30) NOT NULL UNIQUE, -- THUONG, VIP, DOI
    ten_loai NVARCHAR(100) NOT NULL,
    he_so_gia DECIMAL(8,2) NOT NULL DEFAULT(1.00)
);
GO

CREATE TABLE loai_ve (
    loai_ve_id INT IDENTITY(1,1) PRIMARY KEY,
    ma_loai NVARCHAR(30) NOT NULL UNIQUE, -- VE_LE, VE_COMBO...
    ten_loai NVARCHAR(100) NOT NULL,
    mo_ta NVARCHAR(500) NULL
);
GO

CREATE TABLE phuong_thuc_thanh_toan (
    phuong_thuc_thanh_toan_id INT IDENTITY(1,1) PRIMARY KEY,
    ma_phuong_thuc NVARCHAR(30) NOT NULL UNIQUE, -- TIEN_MAT, CHUYEN_KHOAN, QR
    ten_phuong_thuc NVARCHAR(100) NOT NULL
);
GO

-- =========================================================
-- 2) Tai khoan, khach hang, nhan su
-- =========================================================

CREATE TABLE tai_khoan (
    tai_khoan_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NULL UNIQUE,
    so_dien_thoai NVARCHAR(20) NULL UNIQUE,
    mat_khau_hash NVARCHAR(500) NOT NULL,
    ho_ten NVARCHAR(200) NOT NULL,
    gioi_tinh NVARCHAR(20) NULL,
    ngay_sinh DATE NULL,
    avatar_url NVARCHAR(500) NULL,
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'HOAT_DONG'),
    tao_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    cap_nhat_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CHECK (email IS NOT NULL OR so_dien_thoai IS NOT NULL)
);
GO

CREATE TABLE tai_khoan_vai_tro (
    tai_khoan_vai_tro_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tai_khoan_id BIGINT NOT NULL,
    vai_tro_id INT NOT NULL,
    tao_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    UNIQUE (tai_khoan_id, vai_tro_id),
    FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id),
    FOREIGN KEY (vai_tro_id) REFERENCES vai_tro(vai_tro_id)
);
GO

CREATE TABLE thanh_vien (
    thanh_vien_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tai_khoan_id BIGINT NOT NULL UNIQUE,
    loai_thanh_vien_id INT NOT NULL,
    ngay_bat_dau DATE NOT NULL,
    ngay_het_han DATE NULL,
    diem_tich_luy INT NOT NULL DEFAULT(0),
    diem_da_dung INT NOT NULL DEFAULT(0),
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'HOAT_DONG'),
    FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id),
    FOREIGN KEY (loai_thanh_vien_id) REFERENCES loai_thanh_vien(loai_thanh_vien_id)
);
GO

CREATE TABLE lich_su_diem_thanh_vien (
    lich_su_diem_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    thanh_vien_id BIGINT NOT NULL,
    loai_bien_dong NVARCHAR(30) NOT NULL, -- CONG, TRU
    so_diem INT NOT NULL,
    noi_dung NVARCHAR(500) NULL,
    tao_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (thanh_vien_id) REFERENCES thanh_vien(thanh_vien_id)
);
GO

CREATE TABLE ma_xac_thuc_otp (
    ma_xac_thuc_otp_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tai_khoan_id BIGINT NULL,
    email NVARCHAR(255) NULL,
    so_dien_thoai NVARCHAR(20) NULL,
    ma_otp NVARCHAR(10) NOT NULL,
    muc_dich NVARCHAR(50) NOT NULL, -- QUEN_MAT_KHAU, DANG_KY
    het_han_luc DATETIME2 NOT NULL,
    da_su_dung BIT NOT NULL DEFAULT(0),
    tao_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id)
);
GO

-- =========================================================
-- 3) Phim, trailer, hot
-- =========================================================

CREATE TABLE phim (
    phim_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ten_phim NVARCHAR(255) NOT NULL,
    the_loai NVARCHAR(255) NULL,
    dao_dien NVARCHAR(255) NULL,
    dien_vien NVARCHAR(1000) NULL,
    thoi_luong_phut INT NULL,
    gioi_han_tuoi NVARCHAR(20) NULL,
    ngay_khoi_chieu DATE NULL,
    ngon_ngu NVARCHAR(100) NULL,
    poster_url NVARCHAR(500) NULL,
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'SAP_CHIEU'),
    tao_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    cap_nhat_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE TABLE gioi_thieu_phim (
    gioi_thieu_phim_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    phim_id BIGINT NOT NULL,
    noi_dung NVARCHAR(MAX) NOT NULL,
    tao_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    cap_nhat_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (phim_id) REFERENCES phim(phim_id)
);
GO

CREATE TABLE trailer_phim (
    trailer_phim_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    phim_id BIGINT NOT NULL,
    tieu_de NVARCHAR(255) NULL,
    trailer_url NVARCHAR(500) NOT NULL,
    thu_tu_hien_thi INT NOT NULL DEFAULT(1),
    tao_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (phim_id) REFERENCES phim(phim_id)
);
GO

CREATE TABLE phim_hot (
    phim_hot_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    phim_id BIGINT NOT NULL UNIQUE,
    thu_tu_hien_thi INT NOT NULL DEFAULT(1),
    tu_ngay DATE NULL,
    den_ngay DATE NULL,
    FOREIGN KEY (phim_id) REFERENCES phim(phim_id)
);
GO

-- =========================================================
-- 4) Phong chieu, ghe
-- =========================================================

CREATE TABLE phong_chieu (
    phong_chieu_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ma_phong NVARCHAR(30) NOT NULL UNIQUE,
    ten_phong NVARCHAR(100) NOT NULL,
    so_hang INT NOT NULL,
    so_cot INT NOT NULL,
    suc_chua INT NOT NULL,
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'HOAT_DONG')
);
GO

CREATE TABLE ghe (
    ghe_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    phong_chieu_id BIGINT NOT NULL,
    loai_ghe_id INT NOT NULL,
    ma_ghe NVARCHAR(20) NOT NULL, -- A1, A2...
    hang_ghe NVARCHAR(5) NOT NULL,
    cot_ghe INT NOT NULL,
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'HOAT_DONG'),
    UNIQUE (phong_chieu_id, ma_ghe),
    FOREIGN KEY (phong_chieu_id) REFERENCES phong_chieu(phong_chieu_id),
    FOREIGN KEY (loai_ghe_id) REFERENCES loai_ghe(loai_ghe_id)
);
GO

-- =========================================================
-- 5) Suat chieu, gia ve
-- =========================================================

CREATE TABLE suat_chieu (
    suat_chieu_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    phim_id BIGINT NOT NULL,
    phong_chieu_id BIGINT NOT NULL,
    thoi_gian_bat_dau DATETIME2 NOT NULL,
    thoi_gian_ket_thuc DATETIME2 NOT NULL,
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'DANG_MO_BAN'),
    FOREIGN KEY (phim_id) REFERENCES phim(phim_id),
    FOREIGN KEY (phong_chieu_id) REFERENCES phong_chieu(phong_chieu_id),
    CHECK (thoi_gian_ket_thuc > thoi_gian_bat_dau)
);
GO

-- Moi phong chi duoc chieu 1 phim tai 1 thoi diem (khong trung gio bat dau)
CREATE UNIQUE INDEX uq_suat_chieu_phong_bat_dau
ON suat_chieu(phong_chieu_id, thoi_gian_bat_dau);
GO

CREATE TABLE khung_gio (
    khung_gio_id INT IDENTITY(1,1) PRIMARY KEY,
    ten_khung_gio NVARCHAR(100) NOT NULL,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    CHECK (gio_ket_thuc > gio_bat_dau)
);
GO

CREATE TABLE gia_ve_phim (
    gia_ve_phim_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    phim_id BIGINT NOT NULL,
    gia_co_ban DECIMAL(18,2) NOT NULL,
    tu_ngay DATE NOT NULL,
    den_ngay DATE NULL,
    FOREIGN KEY (phim_id) REFERENCES phim(phim_id)
);
GO

CREATE TABLE gia_ve_theo_loai_ghe (
    gia_ve_theo_loai_ghe_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    phim_id BIGINT NOT NULL,
    phong_chieu_id BIGINT NOT NULL,
    loai_ghe_id INT NOT NULL,
    gia_ve DECIMAL(18,2) NOT NULL,
    tu_ngay DATE NOT NULL,
    den_ngay DATE NULL,
    FOREIGN KEY (phim_id) REFERENCES phim(phim_id),
    FOREIGN KEY (phong_chieu_id) REFERENCES phong_chieu(phong_chieu_id),
    FOREIGN KEY (loai_ghe_id) REFERENCES loai_ghe(loai_ghe_id)
);
GO

CREATE TABLE gia_ve_theo_khung_gio (
    gia_ve_theo_khung_gio_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    phim_id BIGINT NOT NULL,
    khung_gio_id INT NOT NULL,
    gia_ve DECIMAL(18,2) NOT NULL,
    tu_ngay DATE NOT NULL,
    den_ngay DATE NULL,
    FOREIGN KEY (phim_id) REFERENCES phim(phim_id),
    FOREIGN KEY (khung_gio_id) REFERENCES khung_gio(khung_gio_id)
);
GO

-- =========================================================
-- 6) Dat ve, thanh toan, QR ve
-- =========================================================

CREATE TABLE don_dat_ve (
    don_dat_ve_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tai_khoan_id BIGINT NULL, -- co the mua tai quay khong can dang nhap
    ma_don NVARCHAR(30) NOT NULL UNIQUE,
    tong_tien_goc DECIMAL(18,2) NOT NULL DEFAULT(0),
    tong_giam DECIMAL(18,2) NOT NULL DEFAULT(0),
    tong_thanh_toan DECIMAL(18,2) NOT NULL DEFAULT(0),
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'CHO_THANH_TOAN'), -- DA_THANH_TOAN, HUY
    kenh_dat NVARCHAR(30) NOT NULL DEFAULT(N'ONLINE'), -- ONLINE, TAI_QUAY
    tao_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id)
);
GO

CREATE TABLE ve (
    ve_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    don_dat_ve_id BIGINT NOT NULL,
    suat_chieu_id BIGINT NOT NULL,
    ghe_id BIGINT NOT NULL,
    loai_ve_id INT NOT NULL,
    gia_ve DECIMAL(18,2) NOT NULL,
    ma_qr_ve NVARCHAR(255) NULL UNIQUE,
    da_checkin BIT NOT NULL DEFAULT(0),
    checkin_luc DATETIME2 NULL,
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'HOP_LE'),
    UNIQUE (suat_chieu_id, ghe_id), -- tranh dat trung ghe
    FOREIGN KEY (don_dat_ve_id) REFERENCES don_dat_ve(don_dat_ve_id),
    FOREIGN KEY (suat_chieu_id) REFERENCES suat_chieu(suat_chieu_id),
    FOREIGN KEY (ghe_id) REFERENCES ghe(ghe_id),
    FOREIGN KEY (loai_ve_id) REFERENCES loai_ve(loai_ve_id)
);
GO

CREATE TABLE thanh_toan (
    thanh_toan_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    don_dat_ve_id BIGINT NOT NULL,
    phuong_thuc_thanh_toan_id INT NOT NULL,
    so_tien DECIMAL(18,2) NOT NULL,
    ma_giao_dich NVARCHAR(100) NULL,
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'THANH_CONG'),
    thanh_toan_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (don_dat_ve_id) REFERENCES don_dat_ve(don_dat_ve_id),
    FOREIGN KEY (phuong_thuc_thanh_toan_id) REFERENCES phuong_thuc_thanh_toan(phuong_thuc_thanh_toan_id)
);
GO

-- =========================================================
-- 7) Su kien, tin tuc, khuyen mai
-- =========================================================

CREATE TABLE su_kien (
    su_kien_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tieu_de NVARCHAR(255) NOT NULL,
    mo_ta_ngan NVARCHAR(1000) NULL,
    noi_dung NVARCHAR(MAX) NULL,
    anh_dai_dien_url NVARCHAR(500) NULL,
    hien_thi_trang_chu BIT NOT NULL DEFAULT(0),
    ngay_bat_dau DATETIME2 NULL,
    ngay_ket_thuc DATETIME2 NULL,
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'HOAT_DONG'),
    tao_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE TABLE chi_tiet_su_kien (
    chi_tiet_su_kien_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    su_kien_id BIGINT NOT NULL,
    tieu_de NVARCHAR(255) NULL,
    noi_dung NVARCHAR(MAX) NOT NULL,
    thu_tu_hien_thi INT NOT NULL DEFAULT(1),
    FOREIGN KEY (su_kien_id) REFERENCES su_kien(su_kien_id)
);
GO

CREATE TABLE gioi_thieu_su_kien (
    gioi_thieu_su_kien_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    su_kien_id BIGINT NOT NULL,
    noi_dung NVARCHAR(MAX) NOT NULL,
    FOREIGN KEY (su_kien_id) REFERENCES su_kien(su_kien_id)
);
GO

CREATE TABLE hinh_anh_su_kien (
    hinh_anh_su_kien_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    su_kien_id BIGINT NOT NULL,
    image_url NVARCHAR(500) NOT NULL,
    hien_thi_trang_chu BIT NOT NULL DEFAULT(0),
    thu_tu_hien_thi INT NOT NULL DEFAULT(1),
    FOREIGN KEY (su_kien_id) REFERENCES su_kien(su_kien_id)
);
GO

CREATE TABLE ma_giam_gia (
    ma_giam_gia_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ma_code NVARCHAR(50) NOT NULL UNIQUE,
    ten_ma NVARCHAR(255) NOT NULL,
    loai_giam NVARCHAR(20) NOT NULL, -- PHAN_TRAM, SO_TIEN
    gia_tri_giam DECIMAL(18,2) NOT NULL,
    ap_dung_cho NVARCHAR(30) NOT NULL, -- PHIM, THANH_VIEN, TOAN_DON
    phim_id BIGINT NULL,
    loai_thanh_vien_id INT NULL,
    so_lan_toi_da INT NULL,
    da_su_dung INT NOT NULL DEFAULT(0),
    ngay_bat_dau DATETIME2 NOT NULL,
    ngay_ket_thuc DATETIME2 NOT NULL,
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'HOAT_DONG'),
    FOREIGN KEY (phim_id) REFERENCES phim(phim_id),
    FOREIGN KEY (loai_thanh_vien_id) REFERENCES loai_thanh_vien(loai_thanh_vien_id)
);
GO

CREATE TABLE su_dung_ma_giam_gia (
    su_dung_ma_giam_gia_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ma_giam_gia_id BIGINT NOT NULL,
    don_dat_ve_id BIGINT NOT NULL,
    tai_khoan_id BIGINT NULL,
    so_tien_giam DECIMAL(18,2) NOT NULL,
    tao_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (ma_giam_gia_id) REFERENCES ma_giam_gia(ma_giam_gia_id),
    FOREIGN KEY (don_dat_ve_id) REFERENCES don_dat_ve(don_dat_ve_id),
    FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id)
);
GO

CREATE TABLE uu_dai_hang_tuan_vip (
    uu_dai_hang_tuan_vip_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    thanh_vien_id BIGINT NOT NULL,
    tuan_nam NVARCHAR(20) NOT NULL, -- VD: 2026-W13
    da_nhan_combo BIT NOT NULL DEFAULT(0),
    ghi_chu_combo NVARCHAR(500) NULL, -- 1 bong + 1 nuoc tuy chon
    ngay_nhan DATETIME2 NULL,
    UNIQUE (thanh_vien_id, tuan_nam),
    FOREIGN KEY (thanh_vien_id) REFERENCES thanh_vien(thanh_vien_id)
);
GO

-- =========================================================
-- 8) Ngan hang, QR thanh toan, hoan tien
-- =========================================================

CREATE TABLE tai_khoan_ngan_hang_he_thong (
    tai_khoan_ngan_hang_he_thong_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ten_ngan_hang NVARCHAR(255) NOT NULL,
    so_tai_khoan NVARCHAR(50) NOT NULL,
    chu_tai_khoan NVARCHAR(255) NOT NULL,
    qr_thanh_toan_url NVARCHAR(500) NULL,
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'HOAT_DONG')
);
GO

CREATE TABLE thong_tin_nhan_tien_khach_hang (
    thong_tin_nhan_tien_khach_hang_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tai_khoan_id BIGINT NOT NULL,
    ten_ngan_hang NVARCHAR(255) NULL,
    so_tai_khoan NVARCHAR(50) NULL,
    chu_tai_khoan NVARCHAR(255) NULL,
    qr_nhan_tien_url NVARCHAR(500) NULL,
    uu_tien_mac_dinh BIT NOT NULL DEFAULT(0),
    FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id)
);
GO

CREATE TABLE yeu_cau_hoan_tien (
    yeu_cau_hoan_tien_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    don_dat_ve_id BIGINT NOT NULL,
    tai_khoan_id BIGINT NOT NULL,
    so_tien_hoan DECIMAL(18,2) NOT NULL,
    ly_do NVARCHAR(1000) NULL,
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'CHO_XU_LY'), -- DA_HOAN, TU_CHOI
    thong_tin_nhan_tien_khach_hang_id BIGINT NULL,
    tao_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    xu_ly_luc DATETIME2 NULL,
    FOREIGN KEY (don_dat_ve_id) REFERENCES don_dat_ve(don_dat_ve_id),
    FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id),
    FOREIGN KEY (thong_tin_nhan_tien_khach_hang_id) REFERENCES thong_tin_nhan_tien_khach_hang(thong_tin_nhan_tien_khach_hang_id)
);
GO

-- =========================================================
-- 9) Ho tro khach hang (chat)
-- =========================================================

CREATE TABLE hoi_thoai_ho_tro (
    hoi_thoai_ho_tro_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    khach_hang_id BIGINT NOT NULL,
    nhan_vien_ho_tro_id BIGINT NULL,
    kenh_lien_lac NVARCHAR(30) NOT NULL, -- CHAT_WEB, ZALO, HOTLINE...
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'DANG_MO'),
    tao_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    dong_luc DATETIME2 NULL,
    FOREIGN KEY (khach_hang_id) REFERENCES tai_khoan(tai_khoan_id),
    FOREIGN KEY (nhan_vien_ho_tro_id) REFERENCES tai_khoan(tai_khoan_id)
);
GO

CREATE TABLE tin_nhan_ho_tro (
    tin_nhan_ho_tro_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    hoi_thoai_ho_tro_id BIGINT NOT NULL,
    nguoi_gui_id BIGINT NOT NULL,
    noi_dung NVARCHAR(MAX) NOT NULL,
    gui_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    FOREIGN KEY (hoi_thoai_ho_tro_id) REFERENCES hoi_thoai_ho_tro(hoi_thoai_ho_tro_id),
    FOREIGN KEY (nguoi_gui_id) REFERENCES tai_khoan(tai_khoan_id)
);
GO

-- =========================================================
-- 10) Noi dung trang user: chinh sach, gioi thieu, lien he
-- =========================================================

CREATE TABLE noi_dung_trang (
    noi_dung_trang_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ma_trang NVARCHAR(50) NOT NULL UNIQUE, -- DIEU_KHOAN, BAO_MAT, GIOI_THIEU_RAP...
    tieu_de NVARCHAR(255) NOT NULL,
    noi_dung NVARCHAR(MAX) NOT NULL,
    cap_nhat_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE TABLE dat_ve_nhom (
    dat_ve_nhom_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    nguoi_lien_he_ten NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NULL,
    so_dien_thoai NVARCHAR(20) NOT NULL,
    so_luong_nguoi INT NOT NULL,
    noi_dung_yeu_cau NVARCHAR(2000) NULL,
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'CHO_TU_VAN'),
    tao_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE TABLE lien_he (
    lien_he_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ho_ten NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NULL,
    so_dien_thoai NVARCHAR(20) NULL,
    tieu_de NVARCHAR(255) NULL,
    noi_dung NVARCHAR(MAX) NOT NULL,
    trang_thai NVARCHAR(30) NOT NULL DEFAULT(N'MOI'),
    tao_luc DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

-- =========================================================
-- 11) Seed du lieu co ban
-- =========================================================

INSERT INTO vai_tro(ma_vai_tro, ten_vai_tro)
VALUES
(N'ADMIN', N'Quan tri vien'),
(N'NHAN_VIEN', N'Nhan vien'),
(N'KHACH_HANG', N'Khach hang');
GO

INSERT INTO loai_thanh_vien(ma_loai, ten_loai, phan_tram_giam, uu_dai_mo_ta)
VALUES
(N'KHONG_DANG_KY', N'Khong dang ky', 0, N'Khong co uu dai'),
(N'THUONG', N'Thanh vien thuong', 10, N'Giam 10%'),
(N'VIP', N'Thanh vien VIP', 20, N'Giam 20% va tang combo 1 bong + 1 nuoc moi tuan 1 lan');
GO

INSERT INTO loai_ghe(ma_loai, ten_loai, he_so_gia)
VALUES
(N'THUONG', N'Ghe thuong', 1.00),
(N'VIP', N'Ghe VIP', 1.30),
(N'DOI', N'Ghe doi', 1.80);
GO

INSERT INTO loai_ve(ma_loai, ten_loai, mo_ta)
VALUES
(N'VE_LE', N'Ve le', N'Ve xem phim thong thuong'),
(N'VE_COMBO', N'Ve combo', N'Ve kem combo bap nuoc');
GO

INSERT INTO phuong_thuc_thanh_toan(ma_phuong_thuc, ten_phuong_thuc)
VALUES
(N'TIEN_MAT', N'Tien mat'),
(N'CHUYEN_KHOAN', N'Chuyen khoan ngan hang'),
(N'QR', N'Thanh toan QR');
GO
