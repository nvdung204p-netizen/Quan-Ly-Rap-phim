-- ============================================================
-- sql_schema_day_du.sql
-- Hệ thống Quản Lý Rạp Chiếu Phim — Schema đầy đủ (SQL Server)
-- Chạy lần đầu: tạo DB + tất cả bảng + seed data
-- ============================================================
IF DB_ID(N'QuanLyRapChieuPhim') IS NULL CREATE DATABASE QuanLyRapChieuPhim;
GO
USE QuanLyRapChieuPhim;
GO

-- ============================================================
-- NHÓM 1: XÁC THỰC & TÀI KHOẢN
-- ============================================================
IF OBJECT_ID(N'vai_tro','U') IS NULL
CREATE TABLE vai_tro (
  vai_tro_id   INT IDENTITY(1,1) PRIMARY KEY,
  ma_vai_tro   NVARCHAR(50)  NOT NULL UNIQUE,
  ten_vai_tro  NVARCHAR(100) NOT NULL
);
GO

IF OBJECT_ID(N'tai_khoan','U') IS NULL
CREATE TABLE tai_khoan (
  tai_khoan_id    BIGINT IDENTITY(1,1) PRIMARY KEY,
  email           NVARCHAR(255) NULL UNIQUE,
  so_dien_thoai   NVARCHAR(20)  NULL UNIQUE,
  mat_khau_hash   NVARCHAR(500) NOT NULL,
  ho_ten          NVARCHAR(255) NOT NULL,
  gioi_tinh       NVARCHAR(10)  NULL,        -- NAM / NU / KHAC
  ngay_sinh       DATE          NULL,
  anh_dai_dien    NVARCHAR(500) NULL,
  trang_thai      NVARCHAR(30)  NOT NULL DEFAULT N'HOAT_DONG',
  tao_luc         DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  cap_nhat_luc    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'tai_khoan_vai_tro','U') IS NULL
CREATE TABLE tai_khoan_vai_tro (
  tai_khoan_vai_tro_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  tai_khoan_id         BIGINT   NOT NULL,
  vai_tro_id           INT      NOT NULL,
  tao_luc              DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT uq_tkvt UNIQUE (tai_khoan_id, vai_tro_id),
  CONSTRAINT fk_tkvt_tk FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id),
  CONSTRAINT fk_tkvt_vt FOREIGN KEY (vai_tro_id)   REFERENCES vai_tro(vai_tro_id)
);
GO

IF OBJECT_ID(N'ma_xac_thuc_otp','U') IS NULL
CREATE TABLE ma_xac_thuc_otp (
  ma_xac_thuc_otp_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  tai_khoan_id       BIGINT        NULL,
  email              NVARCHAR(255) NULL,
  so_dien_thoai      NVARCHAR(20)  NULL,
  ma_otp             NVARCHAR(20)  NOT NULL,
  muc_dich           NVARCHAR(50)  NOT NULL,   -- QUEN_MAT_KHAU / DANG_KY
  het_han_luc        DATETIME2     NOT NULL,
  da_su_dung         BIT           NOT NULL DEFAULT 0,
  tao_luc            DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_otp_tk FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id)
);
GO

-- ============================================================
-- NHÓM 2: PHIM
-- ============================================================
IF OBJECT_ID(N'phim','U') IS NULL
CREATE TABLE phim (
  phim_id         BIGINT IDENTITY(1,1) PRIMARY KEY,
  ten_phim        NVARCHAR(255) NOT NULL,
  the_loai        NVARCHAR(255) NULL,
  dao_dien        NVARCHAR(255) NULL,
  dien_vien       NVARCHAR(MAX) NULL,
  thoi_luong_phut INT           NULL,
  gioi_han_tuoi   NVARCHAR(20)  NULL,   -- P / T13 / T16 / T18
  ngay_khoi_chieu DATE          NULL,
  ngon_ngu        NVARCHAR(100) NULL,
  poster_url      NVARCHAR(500) NULL,
  mo_ta_ngan      NVARCHAR(500) NULL,
  trang_thai      NVARCHAR(30)  NOT NULL DEFAULT N'SAP_CHIEU',  -- SAP_CHIEU / DANG_CHIEU / NGUNG_CHIEU
  tao_luc         DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  cap_nhat_luc    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'gioi_thieu_phim','U') IS NULL
CREATE TABLE gioi_thieu_phim (
  gioi_thieu_phim_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  phim_id            BIGINT        NOT NULL,
  noi_dung           NVARCHAR(MAX) NOT NULL,
  tao_luc            DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  cap_nhat_luc       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_gtp_phim FOREIGN KEY (phim_id) REFERENCES phim(phim_id)
);
GO

IF OBJECT_ID(N'trailer_phim','U') IS NULL
CREATE TABLE trailer_phim (
  trailer_phim_id  BIGINT IDENTITY(1,1) PRIMARY KEY,
  phim_id          BIGINT        NOT NULL,
  tieu_de          NVARCHAR(255) NULL,
  trailer_url      NVARCHAR(500) NOT NULL,
  thu_tu_hien_thi  INT           NOT NULL DEFAULT 1,
  tao_luc          DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_tp_phim FOREIGN KEY (phim_id) REFERENCES phim(phim_id)
);
GO

IF OBJECT_ID(N'phim_hot','U') IS NULL
CREATE TABLE phim_hot (
  phim_hot_id      BIGINT IDENTITY(1,1) PRIMARY KEY,
  phim_id          BIGINT NOT NULL UNIQUE,
  thu_tu_hien_thi  INT    NOT NULL DEFAULT 1,
  tu_ngay          DATE   NULL,
  den_ngay         DATE   NULL,
  CONSTRAINT fk_ph_phim FOREIGN KEY (phim_id) REFERENCES phim(phim_id)
);
GO

-- ============================================================
-- NHÓM 3: PHÒNG CHIẾU & GHẾ
-- ============================================================
IF OBJECT_ID(N'loai_ghe','U') IS NULL
CREATE TABLE loai_ghe (
  loai_ghe_id INT IDENTITY(1,1) PRIMARY KEY,
  ma_loai     NVARCHAR(50)  NOT NULL UNIQUE,   -- THUONG / VIP / DOI
  ten_loai    NVARCHAR(100) NOT NULL,
  he_so_gia   DECIMAL(10,2) NOT NULL DEFAULT 1,
  mau_hien_thi NVARCHAR(20) NULL               -- mã màu hex cho UI
);
GO

IF OBJECT_ID(N'phong_chieu','U') IS NULL
CREATE TABLE phong_chieu (
  phong_chieu_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ma_phong       NVARCHAR(50)  NOT NULL UNIQUE,
  ten_phong      NVARCHAR(100) NOT NULL,
  loai_phong     NVARCHAR(50)  NULL,   -- THUONG / 3D / IMAX / VIP
  so_hang        INT           NOT NULL,
  so_cot         INT           NOT NULL,
  suc_chua       INT           NOT NULL,
  mo_ta          NVARCHAR(500) NULL,
  trang_thai     NVARCHAR(30)  NOT NULL DEFAULT N'HOAT_DONG'
);
GO

IF OBJECT_ID(N'ghe','U') IS NULL
CREATE TABLE ghe (
  ghe_id         BIGINT IDENTITY(1,1) PRIMARY KEY,
  phong_chieu_id BIGINT       NOT NULL,
  loai_ghe_id    INT          NOT NULL,
  ma_ghe         NVARCHAR(20) NOT NULL,
  hang_ghe       NVARCHAR(10) NOT NULL,
  cot_ghe        INT          NOT NULL,
  trang_thai     NVARCHAR(30) NOT NULL DEFAULT N'HOAT_DONG',  -- HOAT_DONG / BAO_TRI / KHOA
  CONSTRAINT uq_ghe    UNIQUE (phong_chieu_id, ma_ghe),
  CONSTRAINT fk_ghe_pc FOREIGN KEY (phong_chieu_id) REFERENCES phong_chieu(phong_chieu_id),
  CONSTRAINT fk_ghe_lg FOREIGN KEY (loai_ghe_id)    REFERENCES loai_ghe(loai_ghe_id)
);
GO

-- ============================================================
-- NHÓM 4: SUẤT CHIẾU & GIÁ VÉ
-- ============================================================
IF OBJECT_ID(N'suat_chieu','U') IS NULL
CREATE TABLE suat_chieu (
  suat_chieu_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
  phim_id             BIGINT    NOT NULL,
  phong_chieu_id      BIGINT    NOT NULL,
  thoi_gian_bat_dau   DATETIME2 NOT NULL,
  thoi_gian_ket_thuc  DATETIME2 NOT NULL,
  trang_thai          NVARCHAR(30) NOT NULL DEFAULT N'DANG_MO_BAN', -- DANG_MO_BAN / DA_KET_THUC / HUY
  CONSTRAINT fk_sc_p  FOREIGN KEY (phim_id)        REFERENCES phim(phim_id),
  CONSTRAINT fk_sc_pc FOREIGN KEY (phong_chieu_id) REFERENCES phong_chieu(phong_chieu_id)
);
GO

IF OBJECT_ID(N'khung_gio','U') IS NULL
CREATE TABLE khung_gio (
  khung_gio_id   INT IDENTITY(1,1) PRIMARY KEY,
  ten_khung_gio  NVARCHAR(100) NOT NULL,
  gio_bat_dau    TIME NOT NULL,
  gio_ket_thuc   TIME NOT NULL
);
GO

IF OBJECT_ID(N'gia_ve_phim','U') IS NULL
CREATE TABLE gia_ve_phim (
  gia_ve_phim_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  phim_id        BIGINT        NOT NULL,
  gia_co_ban     DECIMAL(18,2) NOT NULL,
  tu_ngay        DATE          NOT NULL,
  den_ngay       DATE          NULL,
  CONSTRAINT fk_gvp_p FOREIGN KEY (phim_id) REFERENCES phim(phim_id)
);
GO

IF OBJECT_ID(N'gia_ve_theo_loai_ghe','U') IS NULL
CREATE TABLE gia_ve_theo_loai_ghe (
  gia_ve_theo_loai_ghe_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  phim_id                 BIGINT        NOT NULL,
  phong_chieu_id          BIGINT        NOT NULL,
  loai_ghe_id             INT           NOT NULL,
  gia_ve                  DECIMAL(18,2) NOT NULL,
  tu_ngay                 DATE          NOT NULL,
  den_ngay                DATE          NULL,
  CONSTRAINT fk_gvlg_p  FOREIGN KEY (phim_id)        REFERENCES phim(phim_id),
  CONSTRAINT fk_gvlg_pc FOREIGN KEY (phong_chieu_id) REFERENCES phong_chieu(phong_chieu_id),
  CONSTRAINT fk_gvlg_lg FOREIGN KEY (loai_ghe_id)    REFERENCES loai_ghe(loai_ghe_id)
);
GO

IF OBJECT_ID(N'gia_ve_theo_khung_gio','U') IS NULL
CREATE TABLE gia_ve_theo_khung_gio (
  gia_ve_theo_khung_gio_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  phim_id                  BIGINT        NOT NULL,
  khung_gio_id             INT           NOT NULL,
  gia_ve                   DECIMAL(18,2) NOT NULL,
  tu_ngay                  DATE          NOT NULL,
  den_ngay                 DATE          NULL,
  CONSTRAINT fk_gvkg_p  FOREIGN KEY (phim_id)     REFERENCES phim(phim_id),
  CONSTRAINT fk_gvkg_kg FOREIGN KEY (khung_gio_id) REFERENCES khung_gio(khung_gio_id)
);
GO

-- ============================================================
-- NHÓM 5: VÉ & THANH TOÁN
-- ============================================================
IF OBJECT_ID(N'loai_ve','U') IS NULL
CREATE TABLE loai_ve (
  loai_ve_id INT IDENTITY(1,1) PRIMARY KEY,
  ma_loai    NVARCHAR(50)  NOT NULL UNIQUE,  -- THUONG / TRE_EM / SINH_VIEN
  ten_loai   NVARCHAR(100) NOT NULL,
  mo_ta      NVARCHAR(255) NULL
);
GO

IF OBJECT_ID(N'don_dat_ve','U') IS NULL
CREATE TABLE don_dat_ve (
  don_dat_ve_id    BIGINT IDENTITY(1,1) PRIMARY KEY,
  tai_khoan_id     BIGINT        NULL,
  ma_don           NVARCHAR(100) NOT NULL UNIQUE,
  tong_tien_goc    DECIMAL(18,2) NOT NULL,
  tong_giam        DECIMAL(18,2) NOT NULL DEFAULT 0,
  tong_thanh_toan  DECIMAL(18,2) NOT NULL,
  trang_thai       NVARCHAR(30)  NOT NULL DEFAULT N'CHO_THANH_TOAN', -- CHO_THANH_TOAN / DA_THANH_TOAN / HUY / HOAN_TIEN
  kenh_dat         NVARCHAR(30)  NOT NULL DEFAULT N'ONLINE',           -- ONLINE / QUAY
  ghi_chu          NVARCHAR(500) NULL,
  tao_luc          DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_ddv_tk FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id)
);
GO

IF OBJECT_ID(N've','U') IS NULL
CREATE TABLE ve (
  ve_id          BIGINT IDENTITY(1,1) PRIMARY KEY,
  don_dat_ve_id  BIGINT        NOT NULL,
  suat_chieu_id  BIGINT        NOT NULL,
  ghe_id         BIGINT        NOT NULL,
  loai_ve_id     INT           NOT NULL,
  gia_ve         DECIMAL(18,2) NOT NULL,
  ma_qr_ve       NVARCHAR(200) NULL UNIQUE,
  da_checkin     BIT           NOT NULL DEFAULT 0,
  checkin_luc    DATETIME2     NULL,
  checkin_boi    BIGINT        NULL,   -- FK tai_khoan_id nhân viên checkin
  trang_thai     NVARCHAR(30)  NOT NULL DEFAULT N'HOP_LE', -- HOP_LE / HUY / DA_SU_DUNG
  CONSTRAINT uq_ve_sc_ghe UNIQUE (suat_chieu_id, ghe_id),
  CONSTRAINT fk_ve_ddv FOREIGN KEY (don_dat_ve_id) REFERENCES don_dat_ve(don_dat_ve_id),
  CONSTRAINT fk_ve_sc  FOREIGN KEY (suat_chieu_id) REFERENCES suat_chieu(suat_chieu_id),
  CONSTRAINT fk_ve_g   FOREIGN KEY (ghe_id)         REFERENCES ghe(ghe_id),
  CONSTRAINT fk_ve_lv  FOREIGN KEY (loai_ve_id)     REFERENCES loai_ve(loai_ve_id)
);
GO

IF OBJECT_ID(N'phuong_thuc_thanh_toan','U') IS NULL
CREATE TABLE phuong_thuc_thanh_toan (
  phuong_thuc_thanh_toan_id INT IDENTITY(1,1) PRIMARY KEY,
  ma_phuong_thuc            NVARCHAR(50)  NOT NULL UNIQUE,
  ten_phuong_thuc           NVARCHAR(100) NOT NULL
);
GO

IF OBJECT_ID(N'thanh_toan','U') IS NULL
CREATE TABLE thanh_toan (
  thanh_toan_id             BIGINT IDENTITY(1,1) PRIMARY KEY,
  don_dat_ve_id             BIGINT        NOT NULL,
  phuong_thuc_thanh_toan_id INT           NOT NULL,
  so_tien                   DECIMAL(18,2) NOT NULL,
  ma_giao_dich              NVARCHAR(100) NULL,
  trang_thai                NVARCHAR(30)  NOT NULL DEFAULT N'THANH_CONG',
  ghi_chu                   NVARCHAR(500) NULL,
  thanh_toan_luc            DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_tt_ddv  FOREIGN KEY (don_dat_ve_id)             REFERENCES don_dat_ve(don_dat_ve_id),
  CONSTRAINT fk_tt_pttt FOREIGN KEY (phuong_thuc_thanh_toan_id) REFERENCES phuong_thuc_thanh_toan(phuong_thuc_thanh_toan_id)
);
GO

IF OBJECT_ID(N'qr_thanh_toan','U') IS NULL
CREATE TABLE qr_thanh_toan (
  qr_thanh_toan_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ten_hien_thi     NVARCHAR(200)  NOT NULL,
  url_anh_qr       NVARCHAR(1000) NOT NULL,
  huong_dan        NVARCHAR(1000) NULL,
  thu_tu           INT  NOT NULL DEFAULT 0,
  hoat_dong        BIT  NOT NULL DEFAULT 1
);
GO

IF OBJECT_ID(N'tai_khoan_ngan_hang','U') IS NULL
CREATE TABLE tai_khoan_ngan_hang (
  tai_khoan_ngan_hang_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ten_ngan_hang          NVARCHAR(200) NOT NULL,
  so_tai_khoan           NVARCHAR(100) NOT NULL,
  ten_chu_tai_khoan      NVARCHAR(200) NOT NULL,
  chi_nhanh              NVARCHAR(200) NULL,
  ghi_chu                NVARCHAR(500) NULL,
  thu_tu                 INT  NOT NULL DEFAULT 0,
  hoat_dong              BIT  NOT NULL DEFAULT 1,
  tao_luc                DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- ============================================================
-- NHÓM 6: GIẢM GIÁ
-- ============================================================
IF OBJECT_ID(N'ma_giam_gia','U') IS NULL
CREATE TABLE ma_giam_gia (
  ma_giam_gia_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ma_code        NVARCHAR(50)  NOT NULL UNIQUE,
  ten_ma         NVARCHAR(255) NOT NULL,
  loai_giam      NVARCHAR(30)  NOT NULL,    -- PHAN_TRAM / TIEN_MAT
  gia_tri_giam   DECIMAL(18,2) NOT NULL,
  ap_dung_cho    NVARCHAR(50)  NOT NULL,    -- TOAN_HE_THONG / THEO_PHIM
  phim_id        BIGINT        NULL,
  so_lan_toi_da  INT           NULL,
  da_su_dung     INT           NOT NULL DEFAULT 0,
  ngay_bat_dau   DATETIME2     NOT NULL,
  ngay_ket_thuc  DATETIME2     NOT NULL,
  trang_thai     NVARCHAR(30)  NOT NULL DEFAULT N'HOAT_DONG',
  CONSTRAINT fk_mgg_p FOREIGN KEY (phim_id) REFERENCES phim(phim_id)
);
GO

IF OBJECT_ID(N'su_dung_ma_giam_gia','U') IS NULL
CREATE TABLE su_dung_ma_giam_gia (
  su_dung_ma_giam_gia_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  ma_giam_gia_id         BIGINT        NOT NULL,
  don_dat_ve_id          BIGINT        NOT NULL,
  tai_khoan_id           BIGINT        NULL,
  so_tien_giam           DECIMAL(18,2) NOT NULL,
  tao_luc                DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_sdmg_mg  FOREIGN KEY (ma_giam_gia_id) REFERENCES ma_giam_gia(ma_giam_gia_id),
  CONSTRAINT fk_sdmg_ddv FOREIGN KEY (don_dat_ve_id)  REFERENCES don_dat_ve(don_dat_ve_id),
  CONSTRAINT fk_sdmg_tk  FOREIGN KEY (tai_khoan_id)   REFERENCES tai_khoan(tai_khoan_id)
);
GO

-- Cấu hình % giảm theo hạng thẻ thành viên
IF OBJECT_ID(N'cau_hinh_giam_gia_thanh_vien','U') IS NULL
CREATE TABLE cau_hinh_giam_gia_thanh_vien (
  cau_hinh_id      INT IDENTITY(1,1) PRIMARY KEY,
  hang_thanh_vien  NVARCHAR(30)  NOT NULL UNIQUE,  -- THUONG / VIP
  phan_tram_giam   DECIMAL(5,2)  NOT NULL,          -- 10 / 20
  co_combo_vip     BIT           NOT NULL DEFAULT 0, -- VIP có combo bắp+nước
  mo_ta            NVARCHAR(500) NULL,
  cap_nhat_luc     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Lịch sử admin tặng mã giảm giá cho khách hàng theo ID
IF OBJECT_ID(N'lich_su_tang_ma_giam_gia','U') IS NULL
CREATE TABLE lich_su_tang_ma_giam_gia (
  lich_su_tang_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  tai_khoan_id    BIGINT        NOT NULL,   -- khách hàng được tặng
  ma_giam_gia_id  BIGINT        NOT NULL,
  tang_boi        BIGINT        NULL,       -- admin thực hiện
  ghi_chu         NVARCHAR(500) NULL,
  tao_luc         DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_lstmgg_tk  FOREIGN KEY (tai_khoan_id)   REFERENCES tai_khoan(tai_khoan_id),
  CONSTRAINT fk_lstmgg_mgg FOREIGN KEY (ma_giam_gia_id) REFERENCES ma_giam_gia(ma_giam_gia_id)
);
GO

-- ============================================================
-- NHÓM 7: THẺ THÀNH VIÊN & ĐIỂM THƯỞNG
-- ============================================================
IF OBJECT_ID(N'the_thanh_vien','U') IS NULL
CREATE TABLE the_thanh_vien (
  the_thanh_vien_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  tai_khoan_id      BIGINT       NOT NULL UNIQUE,
  hang_thanh_vien   NVARCHAR(30) NOT NULL DEFAULT N'THUONG', -- THUONG / VIP
  ngay_bat_dau      DATE         NOT NULL,
  ngay_ket_thuc     DATE         NULL,
  trang_thai        NVARCHAR(30) NOT NULL DEFAULT N'HOAT_DONG', -- HOAT_DONG / HET_HAN / TAM_NGUNG
  tao_luc           DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
  cap_nhat_luc      DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_ttv_tk FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id)
);
GO

-- Theo dõi combo miễn phí VIP mỗi tuần (1 bắp + 1 nước)
IF OBJECT_ID(N'combo_vip_hang_tuan','U') IS NULL
CREATE TABLE combo_vip_hang_tuan (
  combo_vip_id    BIGINT IDENTITY(1,1) PRIMARY KEY,
  tai_khoan_id    BIGINT   NOT NULL,
  tuan_nam        INT      NOT NULL,  -- số tuần trong năm (DATEPART(WEEK, ...))
  nam             INT      NOT NULL,
  da_su_dung      BIT      NOT NULL DEFAULT 0,
  su_dung_luc     DATETIME2 NULL,
  don_dat_ve_id   BIGINT    NULL,
  CONSTRAINT uq_combo_vip UNIQUE (tai_khoan_id, tuan_nam, nam),
  CONSTRAINT fk_cvt_tk  FOREIGN KEY (tai_khoan_id)  REFERENCES tai_khoan(tai_khoan_id),
  CONSTRAINT fk_cvt_ddv FOREIGN KEY (don_dat_ve_id) REFERENCES don_dat_ve(don_dat_ve_id)
);
GO

IF OBJECT_ID(N'diem_thuong','U') IS NULL
CREATE TABLE diem_thuong (
  diem_thuong_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  tai_khoan_id   BIGINT    NOT NULL UNIQUE,
  so_diem        BIGINT    NOT NULL DEFAULT 0,
  cap_nhat_luc   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_dt_tk FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id)
);
GO

IF OBJECT_ID(N'lich_su_diem_thuong','U') IS NULL
CREATE TABLE lich_su_diem_thuong (
  lich_su_diem_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  tai_khoan_id    BIGINT        NOT NULL,
  loai_bien_dong  NVARCHAR(30)  NOT NULL,    -- CONG / TRU
  so_diem         BIGINT        NOT NULL,
  ly_do           NVARCHAR(500) NULL,
  don_dat_ve_id   BIGINT        NULL,
  so_du_sau       BIGINT        NOT NULL DEFAULT 0,
  tao_luc         DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_lsdt_tk  FOREIGN KEY (tai_khoan_id)  REFERENCES tai_khoan(tai_khoan_id),
  CONSTRAINT fk_lsdt_ddv FOREIGN KEY (don_dat_ve_id) REFERENCES don_dat_ve(don_dat_ve_id)
);
GO

-- ============================================================
-- NHÓM 8: SỰ KIỆN
-- ============================================================
IF OBJECT_ID(N'su_kien','U') IS NULL
CREATE TABLE su_kien (
  su_kien_id        BIGINT IDENTITY(1,1) PRIMARY KEY,
  tieu_de           NVARCHAR(255) NOT NULL,
  mo_ta_ngan        NVARCHAR(500) NULL,
  noi_dung          NVARCHAR(MAX) NULL,
  anh_dai_dien_url  NVARCHAR(500) NULL,
  hien_thi_trang_chu BIT          NOT NULL DEFAULT 0,
  ngay_bat_dau      DATETIME2     NULL,
  ngay_ket_thuc     DATETIME2     NULL,
  trang_thai        NVARCHAR(30)  NOT NULL DEFAULT N'HOAT_DONG',
  tao_luc           DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID(N'chi_tiet_su_kien','U') IS NULL
CREATE TABLE chi_tiet_su_kien (
  chi_tiet_su_kien_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  su_kien_id          BIGINT        NOT NULL,
  tieu_de_muc         NVARCHAR(255) NULL,
  noi_dung            NVARCHAR(MAX) NOT NULL,
  thu_tu              INT           NOT NULL DEFAULT 1,
  tao_luc             DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_ctsk_sk FOREIGN KEY (su_kien_id) REFERENCES su_kien(su_kien_id)
);
GO

IF OBJECT_ID(N'anh_su_kien_trang_chu','U') IS NULL
CREATE TABLE anh_su_kien_trang_chu (
  anh_id     BIGINT IDENTITY(1,1) PRIMARY KEY,
  su_kien_id BIGINT        NULL,
  url_anh    NVARCHAR(500) NOT NULL,
  tieu_de    NVARCHAR(255) NULL,
  thu_tu     INT           NOT NULL DEFAULT 1,
  hoat_dong  BIT           NOT NULL DEFAULT 1,
  tao_luc    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_astc_sk FOREIGN KEY (su_kien_id) REFERENCES su_kien(su_kien_id)
);
GO

-- ============================================================
-- NHÓM 9: HỖ TRỢ KHÁCH HÀNG
-- ============================================================
IF OBJECT_ID(N'kenh_lien_he','U') IS NULL
CREATE TABLE kenh_lien_he (
  kenh_lien_he_id INT IDENTITY(1,1) PRIMARY KEY,
  ten_kenh        NVARCHAR(100) NOT NULL,   -- Facebook / Zalo / Hotline / Email / Chat
  gia_tri         NVARCHAR(500) NOT NULL,   -- link / số điện thoại
  bieu_tuong      NVARCHAR(100) NULL,       -- icon name / URL
  thu_tu          INT  NOT NULL DEFAULT 0,
  hoat_dong       BIT  NOT NULL DEFAULT 1
);
GO

IF OBJECT_ID(N'cuoc_tro_chuyen_ho_tro','U') IS NULL
CREATE TABLE cuoc_tro_chuyen_ho_tro (
  cuoc_id         BIGINT IDENTITY(1,1) PRIMARY KEY,
  tai_khoan_id    BIGINT        NOT NULL,   -- khách hàng
  ho_ten_kh       NVARCHAR(255) NULL,       -- lưu snapshot tên KH
  nhan_vien_id    BIGINT        NULL,       -- hỗ trợ viên
  trang_thai      NVARCHAR(30)  NOT NULL DEFAULT N'CHO_XU_LY', -- CHO_XU_LY / DANG_XU_LY / DA_DONG
  tao_luc         DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  cap_nhat_luc    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_ctccht_tk FOREIGN KEY (tai_khoan_id) REFERENCES tai_khoan(tai_khoan_id)
);
GO

IF OBJECT_ID(N'tin_nhan_ho_tro','U') IS NULL
CREATE TABLE tin_nhan_ho_tro (
  tin_nhan_id   BIGINT IDENTITY(1,1) PRIMARY KEY,
  cuoc_id       BIGINT        NOT NULL,
  nguoi_gui_id  BIGINT        NOT NULL,   -- tai_khoan_id người gửi
  loai_nguoi    NVARCHAR(20)  NOT NULL,   -- KHACH_HANG / NHAN_VIEN
  noi_dung      NVARCHAR(MAX) NOT NULL,
  da_doc        BIT           NOT NULL DEFAULT 0,
  tao_luc       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_tnht_cuoc FOREIGN KEY (cuoc_id) REFERENCES cuoc_tro_chuyen_ho_tro(cuoc_id)
);
GO

-- ============================================================
-- NHÓM 10: ĐẶT VÉ NHÓM
-- ============================================================
IF OBJECT_ID(N'dat_ve_nhom','U') IS NULL
CREATE TABLE dat_ve_nhom (
  dat_ve_nhom_id  BIGINT IDENTITY(1,1) PRIMARY KEY,
  tai_khoan_id    BIGINT        NULL,      -- người đặt (tổ chức)
  ten_to_chuc     NVARCHAR(255) NULL,
  so_dien_thoai   NVARCHAR(20)  NULL,
  email           NVARCHAR(255) NULL,
  suat_chieu_id   BIGINT        NOT NULL,
  so_luong_ve     INT           NOT NULL,
  ghi_chu         NVARCHAR(500) NULL,
  trang_thai      NVARCHAR(30)  NOT NULL DEFAULT N'CHO_XAC_NHAN', -- CHO_XAC_NHAN / DA_XAC_NHAN / HUY
  tao_luc         DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_dvn_sc FOREIGN KEY (suat_chieu_id) REFERENCES suat_chieu(suat_chieu_id),
  CONSTRAINT fk_dvn_tk FOREIGN KEY (tai_khoan_id)  REFERENCES tai_khoan(tai_khoan_id)
);
GO

-- ============================================================
-- INDEXES (tăng hiệu năng truy vấn)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_suat_chieu_phim_ngay')
  CREATE INDEX IX_suat_chieu_phim_ngay ON suat_chieu(phim_id, thoi_gian_bat_dau);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_suat_chieu_phong_ngay')
  CREATE INDEX IX_suat_chieu_phong_ngay ON suat_chieu(phong_chieu_id, thoi_gian_bat_dau);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_don_dat_ve_tk')
  CREATE INDEX IX_don_dat_ve_tk ON don_dat_ve(tai_khoan_id, tao_luc DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_don_dat_ve_trang_thai')
  CREATE INDEX IX_don_dat_ve_trang_thai ON don_dat_ve(trang_thai);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_ve_don')
  CREATE INDEX IX_ve_don ON ve(don_dat_ve_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_ve_suat_trang_thai')
  CREATE INDEX IX_ve_suat_trang_thai ON ve(suat_chieu_id, trang_thai);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_lich_su_diem_tk')
  CREATE INDEX IX_lich_su_diem_tk ON lich_su_diem_thuong(tai_khoan_id, tao_luc DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_tin_nhan_cuoc')
  CREATE INDEX IX_tin_nhan_cuoc ON tin_nhan_ho_tro(cuoc_id, tao_luc);
GO

-- ============================================================
-- SEED DATA — Dữ liệu mặc định
-- ============================================================

-- Vai trò
IF NOT EXISTS (SELECT 1 FROM vai_tro WHERE ma_vai_tro=N'ADMIN')
  INSERT INTO vai_tro(ma_vai_tro,ten_vai_tro) VALUES(N'ADMIN',N'Quản trị viên');
IF NOT EXISTS (SELECT 1 FROM vai_tro WHERE ma_vai_tro=N'NHAN_VIEN')
  INSERT INTO vai_tro(ma_vai_tro,ten_vai_tro) VALUES(N'NHAN_VIEN',N'Nhân viên');
IF NOT EXISTS (SELECT 1 FROM vai_tro WHERE ma_vai_tro=N'KHACH_HANG')
  INSERT INTO vai_tro(ma_vai_tro,ten_vai_tro) VALUES(N'KHACH_HANG',N'Khách hàng');
GO

-- Loại vé
IF NOT EXISTS (SELECT 1 FROM loai_ve WHERE ma_loai=N'THUONG')
  INSERT INTO loai_ve(ma_loai,ten_loai,mo_ta) VALUES(N'THUONG',N'Vé thường',N'Vé tiêu chuẩn.');
IF NOT EXISTS (SELECT 1 FROM loai_ve WHERE ma_loai=N'TRE_EM')
  INSERT INTO loai_ve(ma_loai,ten_loai,mo_ta) VALUES(N'TRE_EM',N'Vé trẻ em',N'Dưới 12 tuổi.');
IF NOT EXISTS (SELECT 1 FROM loai_ve WHERE ma_loai=N'SINH_VIEN')
  INSERT INTO loai_ve(ma_loai,ten_loai,mo_ta) VALUES(N'SINH_VIEN',N'Vé sinh viên',N'Xuất trình thẻ SV còn hạn.');
GO

-- Phương thức thanh toán
IF NOT EXISTS (SELECT 1 FROM phuong_thuc_thanh_toan WHERE ma_phuong_thuc=N'TIEN_MAT')
  INSERT INTO phuong_thuc_thanh_toan(ma_phuong_thuc,ten_phuong_thuc) VALUES(N'TIEN_MAT',N'Tiền mặt');
IF NOT EXISTS (SELECT 1 FROM phuong_thuc_thanh_toan WHERE ma_phuong_thuc=N'CHUYEN_KHOAN')
  INSERT INTO phuong_thuc_thanh_toan(ma_phuong_thuc,ten_phuong_thuc) VALUES(N'CHUYEN_KHOAN',N'Chuyển khoản ngân hàng');
IF NOT EXISTS (SELECT 1 FROM phuong_thuc_thanh_toan WHERE ma_phuong_thuc=N'VI_DIEN_TU')
  INSERT INTO phuong_thuc_thanh_toan(ma_phuong_thuc,ten_phuong_thuc) VALUES(N'VI_DIEN_TU',N'Ví điện tử (MoMo/ZaloPay)');
GO

-- Loại ghế
IF NOT EXISTS (SELECT 1 FROM loai_ghe WHERE ma_loai=N'THUONG')
  INSERT INTO loai_ghe(ma_loai,ten_loai,he_so_gia,mau_hien_thi) VALUES(N'THUONG',N'Ghế thường',1.0,N'#4CAF50');
IF NOT EXISTS (SELECT 1 FROM loai_ghe WHERE ma_loai=N'VIP')
  INSERT INTO loai_ghe(ma_loai,ten_loai,he_so_gia,mau_hien_thi) VALUES(N'VIP',N'Ghế VIP',1.5,N'#FFD700');
IF NOT EXISTS (SELECT 1 FROM loai_ghe WHERE ma_loai=N'DOI')
  INSERT INTO loai_ghe(ma_loai,ten_loai,he_so_gia,mau_hien_thi) VALUES(N'DOI',N'Ghế đôi',1.8,N'#E91E8C');
GO

-- Khung giờ
IF NOT EXISTS (SELECT 1 FROM khung_gio WHERE ten_khung_gio=N'Sáng')
  INSERT INTO khung_gio(ten_khung_gio,gio_bat_dau,gio_ket_thuc) VALUES(N'Sáng','08:00','11:59');
IF NOT EXISTS (SELECT 1 FROM khung_gio WHERE ten_khung_gio=N'Chiều')
  INSERT INTO khung_gio(ten_khung_gio,gio_bat_dau,gio_ket_thuc) VALUES(N'Chiều','12:00','17:59');
IF NOT EXISTS (SELECT 1 FROM khung_gio WHERE ten_khung_gio=N'Tối')
  INSERT INTO khung_gio(ten_khung_gio,gio_bat_dau,gio_ket_thuc) VALUES(N'Tối','18:00','23:30');
GO

-- Cấu hình giảm giá thành viên
IF NOT EXISTS (SELECT 1 FROM cau_hinh_giam_gia_thanh_vien WHERE hang_thanh_vien=N'THUONG')
  INSERT INTO cau_hinh_giam_gia_thanh_vien(hang_thanh_vien,phan_tram_giam,co_combo_vip,mo_ta)
  VALUES(N'THUONG',10,0,N'Thành viên thường — giảm 10% mọi vé.');
IF NOT EXISTS (SELECT 1 FROM cau_hinh_giam_gia_thanh_vien WHERE hang_thanh_vien=N'VIP')
  INSERT INTO cau_hinh_giam_gia_thanh_vien(hang_thanh_vien,phan_tram_giam,co_combo_vip,mo_ta)
  VALUES(N'VIP',20,1,N'Thành viên VIP — giảm 20% + 1 combo bắp lớn & 1 nước tự chọn mỗi tuần.');
GO

-- Kênh liên hệ mặc định
IF NOT EXISTS (SELECT 1 FROM kenh_lien_he WHERE ten_kenh=N'Hotline')
  INSERT INTO kenh_lien_he(ten_kenh,gia_tri,thu_tu) VALUES(N'Hotline',N'1900 xxxx',1);
IF NOT EXISTS (SELECT 1 FROM kenh_lien_he WHERE ten_kenh=N'Email')
  INSERT INTO kenh_lien_he(ten_kenh,gia_tri,thu_tu) VALUES(N'Email',N'support@cinema.vn',2);
IF NOT EXISTS (SELECT 1 FROM kenh_lien_he WHERE ten_kenh=N'Facebook')
  INSERT INTO kenh_lien_he(ten_kenh,gia_tri,thu_tu) VALUES(N'Facebook',N'https://fb.com/cinema',3);
GO

-- Phòng chiếu mẫu
IF NOT EXISTS (SELECT 1 FROM phong_chieu WHERE ma_phong=N'P01')
  INSERT INTO phong_chieu(ma_phong,ten_phong,loai_phong,so_hang,so_cot,suc_chua)
  VALUES(N'P01',N'Phòng 1',N'THUONG',5,8,40);
IF NOT EXISTS (SELECT 1 FROM phong_chieu WHERE ma_phong=N'P02')
  INSERT INTO phong_chieu(ma_phong,ten_phong,loai_phong,so_hang,so_cot,suc_chua)
  VALUES(N'P02',N'Phòng 2',N'VIP',6,10,60);
GO

-- Tài khoản demo
IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE email=N'admin.demo@cinema.vn')
  INSERT INTO tai_khoan(email,so_dien_thoai,mat_khau_hash,ho_ten,trang_thai,tao_luc,cap_nhat_luc)
  VALUES(N'admin.demo@cinema.vn',N'0901000001',
    N'100000.7rNZRWnaqxVH/jQB9Kxevg==.0qN8inWgAngrQiWmO5ZIW2iIvruhkgslMXn9mMuXsZw=',
    N'Nguyễn Quản Trị',N'HOAT_DONG',SYSUTCDATETIME(),SYSUTCDATETIME());
IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE email=N'nhanvien.demo@cinema.vn')
  INSERT INTO tai_khoan(email,so_dien_thoai,mat_khau_hash,ho_ten,trang_thai,tao_luc,cap_nhat_luc)
  VALUES(N'nhanvien.demo@cinema.vn',N'0901000002',
    N'100000.7rNZRWnaqxVH/jQB9Kxevg==.0qN8inWgAngrQiWmO5ZIW2iIvruhkgslMXn9mMuXsZw=',
    N'Trần Nhân Viên',N'HOAT_DONG',SYSUTCDATETIME(),SYSUTCDATETIME());
IF NOT EXISTS (SELECT 1 FROM tai_khoan WHERE email=N'khach.demo@cinema.vn')
  INSERT INTO tai_khoan(email,so_dien_thoai,mat_khau_hash,ho_ten,trang_thai,tao_luc,cap_nhat_luc)
  VALUES(N'khach.demo@cinema.vn',N'0901000003',
    N'100000.7rNZRWnaqxVH/jQB9Kxevg==.0qN8inWgAngrQiWmO5ZIW2iIvruhkgslMXn9mMuXsZw=',
    N'Lê Khách Hàng',N'HOAT_DONG',SYSUTCDATETIME(),SYSUTCDATETIME());
GO

DECLARE @vtAdmin INT=(SELECT TOP 1 vai_tro_id FROM vai_tro WHERE ma_vai_tro=N'ADMIN');
DECLARE @vtNV    INT=(SELECT TOP 1 vai_tro_id FROM vai_tro WHERE ma_vai_tro=N'NHAN_VIEN');
DECLARE @vtKH    INT=(SELECT TOP 1 vai_tro_id FROM vai_tro WHERE ma_vai_tro=N'KHACH_HANG');
DECLARE @tkA  BIGINT=(SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email=N'admin.demo@cinema.vn');
DECLARE @tkNV BIGINT=(SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email=N'nhanvien.demo@cinema.vn');
DECLARE @tkKH BIGINT=(SELECT TOP 1 tai_khoan_id FROM tai_khoan WHERE email=N'khach.demo@cinema.vn');

IF @tkA IS NOT NULL AND @vtAdmin IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tai_khoan_vai_tro WHERE tai_khoan_id=@tkA AND vai_tro_id=@vtAdmin)
  INSERT INTO tai_khoan_vai_tro(tai_khoan_id,vai_tro_id) VALUES(@tkA,@vtAdmin);
IF @tkNV IS NOT NULL AND @vtNV IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tai_khoan_vai_tro WHERE tai_khoan_id=@tkNV AND vai_tro_id=@vtNV)
  INSERT INTO tai_khoan_vai_tro(tai_khoan_id,vai_tro_id) VALUES(@tkNV,@vtNV);
IF @tkKH IS NOT NULL AND @vtKH IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tai_khoan_vai_tro WHERE tai_khoan_id=@tkKH AND vai_tro_id=@vtKH)
  INSERT INTO tai_khoan_vai_tro(tai_khoan_id,vai_tro_id) VALUES(@tkKH,@vtKH);

-- Khởi tạo điểm thưởng cho khách demo
IF @tkKH IS NOT NULL AND NOT EXISTS (SELECT 1 FROM diem_thuong WHERE tai_khoan_id=@tkKH)
  INSERT INTO diem_thuong(tai_khoan_id,so_diem) VALUES(@tkKH,150);

-- Thẻ thành viên demo
IF @tkKH IS NOT NULL AND NOT EXISTS (SELECT 1 FROM the_thanh_vien WHERE tai_khoan_id=@tkKH)
  INSERT INTO the_thanh_vien(tai_khoan_id,hang_thanh_vien,ngay_bat_dau,ngay_ket_thuc)
  VALUES(@tkKH,N'THUONG',CAST(GETDATE() AS DATE),DATEADD(YEAR,1,CAST(GETDATE() AS DATE)));
GO

-- ============================================================
-- STORED PROCEDURES & TRIGGERS
-- ============================================================

-- Gỡ bản cũ
IF OBJECT_ID(N'dbo.trg_su_dung_ma_giam_gia_AfterInsert','TR') IS NOT NULL DROP TRIGGER dbo.trg_su_dung_ma_giam_gia_AfterInsert;
IF OBJECT_ID(N'dbo.trg_su_dung_ma_giam_gia_AfterDelete','TR') IS NOT NULL DROP TRIGGER dbo.trg_su_dung_ma_giam_gia_AfterDelete;
IF OBJECT_ID(N'dbo.trg_ve_AfterInsUpdDel','TR') IS NOT NULL DROP TRIGGER dbo.trg_ve_AfterInsUpdDel;
IF OBJECT_ID(N'dbo.trg_ve_AfterInsUpd_KiemTraPhongGhe','TR') IS NOT NULL DROP TRIGGER dbo.trg_ve_AfterInsUpd_KiemTraPhongGhe;
IF OBJECT_ID(N'dbo.trg_tai_khoan_AfterUpdate_CapNhatLuc','TR') IS NOT NULL DROP TRIGGER dbo.trg_tai_khoan_AfterUpdate_CapNhatLuc;
IF OBJECT_ID(N'dbo.sp_CapNhatTongTienDonDatVe','P') IS NOT NULL DROP PROCEDURE dbo.sp_CapNhatTongTienDonDatVe;
IF OBJECT_ID(N'dbo.sp_LayGheConTrongTheoSuat','P') IS NOT NULL DROP PROCEDURE dbo.sp_LayGheConTrongTheoSuat;
IF OBJECT_ID(N'dbo.sp_TinhGiaVeChoGhe','P') IS NOT NULL DROP PROCEDURE dbo.sp_TinhGiaVeChoGhe;
GO

CREATE PROCEDURE dbo.sp_CapNhatTongTienDonDatVe @don_dat_ve_id BIGINT AS
BEGIN
  SET NOCOUNT ON;
  IF @don_dat_ve_id IS NULL RETURN;
  UPDATE d SET
    tong_tien_goc   = ISNULL(agg.tong,0),
    tong_thanh_toan = CASE WHEN ISNULL(agg.tong,0)-d.tong_giam<0 THEN 0 ELSE ISNULL(agg.tong,0)-d.tong_giam END
  FROM don_dat_ve d
  OUTER APPLY (SELECT SUM(v.gia_ve) AS tong FROM ve v WHERE v.don_dat_ve_id=@don_dat_ve_id) agg
  WHERE d.don_dat_ve_id=@don_dat_ve_id;
END;
GO

CREATE PROCEDURE dbo.sp_LayGheConTrongTheoSuat @suat_chieu_id BIGINT AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @phong_id BIGINT;
  SELECT @phong_id=phong_chieu_id FROM suat_chieu WHERE suat_chieu_id=@suat_chieu_id;
  IF @phong_id IS NULL RETURN;
  SELECT g.* FROM ghe g
  WHERE g.phong_chieu_id=@phong_id AND g.trang_thai=N'HOAT_DONG'
    AND NOT EXISTS (SELECT 1 FROM ve v WHERE v.suat_chieu_id=@suat_chieu_id AND v.ghe_id=g.ghe_id AND ISNULL(v.trang_thai,N'')<>N'HUY')
  ORDER BY g.hang_ghe, g.cot_ghe;
END;
GO

CREATE TRIGGER dbo.trg_su_dung_ma_giam_gia_AfterInsert ON dbo.su_dung_ma_giam_gia AFTER INSERT AS
BEGIN
  SET NOCOUNT ON;
  UPDATE m SET da_su_dung=m.da_su_dung+i.cnt
  FROM ma_giam_gia m
  INNER JOIN (SELECT ma_giam_gia_id,COUNT(*) AS cnt FROM inserted GROUP BY ma_giam_gia_id) i
  ON m.ma_giam_gia_id=i.ma_giam_gia_id;
END;
GO

CREATE TRIGGER dbo.trg_su_dung_ma_giam_gia_AfterDelete ON dbo.su_dung_ma_giam_gia AFTER DELETE AS
BEGIN
  SET NOCOUNT ON;
  UPDATE m SET da_su_dung=CASE WHEN m.da_su_dung-d.cnt<0 THEN 0 ELSE m.da_su_dung-d.cnt END
  FROM ma_giam_gia m
  INNER JOIN (SELECT ma_giam_gia_id,COUNT(*) AS cnt FROM deleted GROUP BY ma_giam_gia_id) d
  ON m.ma_giam_gia_id=d.ma_giam_gia_id;
END;
GO

CREATE TRIGGER dbo.trg_ve_AfterInsUpd_KiemTraPhongGhe ON dbo.ve AFTER INSERT,UPDATE AS
BEGIN
  SET NOCOUNT ON;
  IF EXISTS (
    SELECT 1 FROM inserted i
    INNER JOIN suat_chieu sc ON sc.suat_chieu_id=i.suat_chieu_id
    INNER JOIN ghe g ON g.ghe_id=i.ghe_id
    WHERE g.phong_chieu_id<>sc.phong_chieu_id
  ) BEGIN RAISERROR(N'Lỗi: ghế không thuộc phòng của suất chiếu.',16,1); ROLLBACK TRANSACTION; END
END;
GO

CREATE TRIGGER dbo.trg_ve_AfterInsUpdDel ON dbo.ve AFTER INSERT,UPDATE,DELETE AS
BEGIN
  SET NOCOUNT ON;
  ;WITH aff AS (SELECT don_dat_ve_id FROM inserted UNION SELECT don_dat_ve_id FROM deleted)
  UPDATE d SET
    tong_tien_goc   = ISNULL(agg.tong,0),
    tong_thanh_toan = CASE WHEN ISNULL(agg.tong,0)-d.tong_giam<0 THEN 0 ELSE ISNULL(agg.tong,0)-d.tong_giam END
  FROM don_dat_ve d
  INNER JOIN aff ON aff.don_dat_ve_id=d.don_dat_ve_id
  OUTER APPLY (SELECT SUM(v.gia_ve) AS tong FROM ve v WHERE v.don_dat_ve_id=d.don_dat_ve_id) agg;
END;
GO

CREATE TRIGGER dbo.trg_tai_khoan_AfterUpdate_CapNhatLuc ON dbo.tai_khoan AFTER UPDATE AS
BEGIN
  SET NOCOUNT ON;
  IF NOT UPDATE(email) AND NOT UPDATE(so_dien_thoai) AND NOT UPDATE(mat_khau_hash)
     AND NOT UPDATE(ho_ten) AND NOT UPDATE(trang_thai) RETURN;
  UPDATE t SET cap_nhat_luc=SYSUTCDATETIME()
  FROM tai_khoan t INNER JOIN inserted i ON i.tai_khoan_id=t.tai_khoan_id;
END;
GO

EXEC sys.sp_settriggerorder @triggername=N'trg_ve_AfterInsUpd_KiemTraPhongGhe',@order=N'First',@stmttype=N'INSERT';
EXEC sys.sp_settriggerorder @triggername=N'trg_ve_AfterInsUpd_KiemTraPhongGhe',@order=N'First',@stmttype=N'UPDATE';
EXEC sys.sp_settriggerorder @triggername=N'trg_ve_AfterInsUpdDel',@order=N'Last',@stmttype=N'INSERT';
EXEC sys.sp_settriggerorder @triggername=N'trg_ve_AfterInsUpdDel',@order=N'Last',@stmttype=N'UPDATE';
EXEC sys.sp_settriggerorder @triggername=N'trg_ve_AfterInsUpdDel',@order=N'Last',@stmttype=N'DELETE';
GO

PRINT N'=== sql_schema_day_du.sql chạy thành công ===';
GO
