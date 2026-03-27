USE QuanLyRapChieuPhim;
GO

SET NOCOUNT ON;
GO

BEGIN TRY
    BEGIN TRAN;

    ------------------------------------------------------------
    -- 1) Phim
    ------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM phim WHERE ten_phim = N'Thoi oi - T18')
    BEGIN
        INSERT INTO phim
        (
            ten_phim, the_loai, dao_dien, dien_vien, thoi_luong_phut, gioi_han_tuoi,
            ngay_khoi_chieu, ngon_ngu, poster_url, trang_thai
        )
        VALUES
        (N'Thoi oi - T18', N'Tam ly, tinh cam', N'Dao dien A', N'Dien vien A, Dien vien B', 118, N'T18', '2026-02-17', N'Tieng Viet', N'https://picsum.photos/seed/thoi-oi/300/450', N'DANG_CHIEU'),
        (N'Dem ngay xa me - T13', N'Tam ly, tinh cam', N'Dao dien B', N'Dien vien C, Dien vien D', 112, N'T13', '2026-03-13', N'Tieng Viet', N'https://picsum.photos/seed/dem-ngay/300/450', N'DANG_CHIEU'),
        (N'Tai - T16', N'Tam ly, hanh dong', N'Dao dien C', N'Dien vien E, Dien vien F', 125, N'T16', '2026-03-06', N'Tieng Viet', N'https://picsum.photos/seed/tai-t16/300/450', N'DANG_CHIEU'),
        (N'Canh doi mo xam - T13', N'Tam ly, tinh cam', N'Dao dien D', N'Dien vien G, Dien vien H', 116, N'T13', '2026-03-20', N'Tieng Viet', N'https://picsum.photos/seed/canh-doi/300/450', N'DANG_CHIEU'),
        (N'Phim sap chieu 1', N'Phieu luu', N'Dao dien E', N'Dien vien I', 110, N'P', '2026-04-15', N'Tieng Viet', N'https://picsum.photos/seed/sap-chieu-1/300/450', N'SAP_CHIEU'),
        (N'Phim sap chieu 2', N'Hanh dong', N'Dao dien F', N'Dien vien J', 130, N'T16', '2026-05-01', N'Tieng Anh', N'https://picsum.photos/seed/sap-chieu-2/300/450', N'SAP_CHIEU');
    END

    ------------------------------------------------------------
    -- 2) Gioi thieu + trailer + phim hot
    ------------------------------------------------------------
    INSERT INTO gioi_thieu_phim(phim_id, noi_dung)
    SELECT p.phim_id, N'Gioi thieu phim: ' + p.ten_phim
    FROM phim p
    WHERE NOT EXISTS (
        SELECT 1 FROM gioi_thieu_phim g WHERE g.phim_id = p.phim_id
    );

    INSERT INTO trailer_phim(phim_id, tieu_de, trailer_url, thu_tu_hien_thi)
    SELECT p.phim_id, N'Trailer chinh', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1
    FROM phim p
    WHERE NOT EXISTS (
        SELECT 1 FROM trailer_phim t WHERE t.phim_id = p.phim_id
    );

    INSERT INTO phim_hot(phim_id, thu_tu_hien_thi, tu_ngay, den_ngay)
    SELECT TOP 4 p.phim_id, ROW_NUMBER() OVER (ORDER BY p.ngay_khoi_chieu DESC), CAST(GETDATE() AS DATE), DATEADD(DAY, 30, CAST(GETDATE() AS DATE))
    FROM phim p
    WHERE p.trang_thai = N'DANG_CHIEU'
      AND NOT EXISTS (SELECT 1 FROM phim_hot h WHERE h.phim_id = p.phim_id)
    ORDER BY p.ngay_khoi_chieu DESC;

    ------------------------------------------------------------
    -- 3) Phong chieu
    ------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM phong_chieu WHERE ma_phong = N'P01')
    BEGIN
        INSERT INTO phong_chieu(ma_phong, ten_phong, so_hang, so_cot, suc_chua, trang_thai)
        VALUES
        (N'P01', N'Phong chieu 1', 8, 10, 80, N'HOAT_DONG'),
        (N'P02', N'Phong chieu 2', 8, 10, 80, N'HOAT_DONG'),
        (N'P03', N'Phong chieu 3', 8, 10, 80, N'HOAT_DONG');
    END

    ------------------------------------------------------------
    -- 4) Ghe mau cho moi phong (A1..H10)
    -- A-B: VIP | C-G: THUONG | H: DOI
    ------------------------------------------------------------
    DECLARE @LoaiThuong INT = (SELECT TOP 1 loai_ghe_id FROM loai_ghe WHERE ma_loai = N'THUONG');
    DECLARE @LoaiVip INT = (SELECT TOP 1 loai_ghe_id FROM loai_ghe WHERE ma_loai = N'VIP');
    DECLARE @LoaiDoi INT = (SELECT TOP 1 loai_ghe_id FROM loai_ghe WHERE ma_loai = N'DOI');

    DECLARE @PhongId BIGINT;
    DECLARE curPhong CURSOR FOR
        SELECT phong_chieu_id FROM phong_chieu;
    OPEN curPhong;
    FETCH NEXT FROM curPhong INTO @PhongId;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        DECLARE @r INT = 1;
        WHILE @r <= 8
        BEGIN
            DECLARE @RowChar NVARCHAR(2) = CHAR(64 + @r); -- A..H
            DECLARE @c INT = 1;
            WHILE @c <= 10
            BEGIN
                DECLARE @MaGhe NVARCHAR(20) = @RowChar + CAST(@c AS NVARCHAR(10));
                IF NOT EXISTS (SELECT 1 FROM ghe WHERE phong_chieu_id = @PhongId AND ma_ghe = @MaGhe)
                BEGIN
                    INSERT INTO ghe(phong_chieu_id, loai_ghe_id, ma_ghe, hang_ghe, cot_ghe, trang_thai)
                    VALUES
                    (
                        @PhongId,
                        CASE
                            WHEN @r IN (1,2) THEN @LoaiVip
                            WHEN @r = 8 THEN @LoaiDoi
                            ELSE @LoaiThuong
                        END,
                        @MaGhe,
                        @RowChar,
                        @c,
                        N'HOAT_DONG'
                    );
                END
                SET @c = @c + 1;
            END
            SET @r = @r + 1;
        END

        FETCH NEXT FROM curPhong INTO @PhongId;
    END
    CLOSE curPhong;
    DEALLOCATE curPhong;

    ------------------------------------------------------------
    -- 5) Khung gio + gia ve
    ------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM khung_gio WHERE ten_khung_gio = N'Sang')
    BEGIN
        INSERT INTO khung_gio(ten_khung_gio, gio_bat_dau, gio_ket_thuc)
        VALUES
        (N'Sang', '08:00', '11:59'),
        (N'Chieu', '12:00', '17:59'),
        (N'Toi', '18:00', '23:59');
    END

    INSERT INTO gia_ve_phim(phim_id, gia_co_ban, tu_ngay, den_ngay)
    SELECT p.phim_id, 85000, CAST(GETDATE() AS DATE), DATEADD(DAY, 90, CAST(GETDATE() AS DATE))
    FROM phim p
    WHERE NOT EXISTS (
        SELECT 1 FROM gia_ve_phim g
        WHERE g.phim_id = p.phim_id
          AND g.tu_ngay <= CAST(GETDATE() AS DATE)
          AND (g.den_ngay IS NULL OR g.den_ngay >= CAST(GETDATE() AS DATE))
    );

    ------------------------------------------------------------
    -- 6) Suat chieu 7 ngay toi (moi phong 2 suat/ngay)
    ------------------------------------------------------------
    ;WITH ngay AS
    (
        SELECT CAST(GETDATE() AS DATE) AS d, 0 AS n
        UNION ALL
        SELECT DATEADD(DAY, 1, d), n + 1
        FROM ngay WHERE n < 6
    ),
    ds_phim AS
    (
        SELECT phim_id, ROW_NUMBER() OVER (ORDER BY phim_id) AS rn
        FROM phim WHERE trang_thai IN (N'DANG_CHIEU', N'SAP_CHIEU')
    ),
    ds_phong AS
    (
        SELECT phong_chieu_id, ROW_NUMBER() OVER (ORDER BY phong_chieu_id) AS rn
        FROM phong_chieu
    )
    INSERT INTO suat_chieu(phim_id, phong_chieu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)
    SELECT
        p.phim_id,
        r.phong_chieu_id,
        DATEADD(HOUR, slot.start_hour, CAST(n.d AS DATETIME2)),
        DATEADD(HOUR, slot.end_hour, CAST(n.d AS DATETIME2)),
        N'DANG_MO_BAN'
    FROM ngay n
    CROSS JOIN ds_phong r
    CROSS APPLY (VALUES (9, 11), (19, 21)) slot(start_hour, end_hour)
    JOIN ds_phim p ON p.rn = ((r.rn + n.n) % (SELECT COUNT(*) FROM ds_phim)) + 1
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM suat_chieu sc
        WHERE sc.phong_chieu_id = r.phong_chieu_id
          AND sc.thoi_gian_bat_dau = DATEADD(HOUR, slot.start_hour, CAST(n.d AS DATETIME2))
    )
    OPTION (MAXRECURSION 10);

    ------------------------------------------------------------
    -- 7) Su kien + hinh anh + chi tiet
    ------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM su_kien WHERE tieu_de = N'Tuan le phim Viet')
    BEGIN
        INSERT INTO su_kien(tieu_de, mo_ta_ngan, noi_dung, anh_dai_dien_url, hien_thi_trang_chu, ngay_bat_dau, ngay_ket_thuc, trang_thai)
        VALUES
        (N'Tuan le phim Viet', N'Uu dai ve phim Viet', N'Giam gia ve vao thu 2-4-6', N'https://picsum.photos/seed/sk1/800/400', 1, DATEADD(DAY, -3, GETDATE()), DATEADD(DAY, 20, GETDATE()), N'HOAT_DONG'),
        (N'Lien hoan phim mua he', N'Chuoi su kien mua he', N'Nhieu phim hot va qua tang', N'https://picsum.photos/seed/sk2/800/400', 1, GETDATE(), DATEADD(DAY, 45, GETDATE()), N'HOAT_DONG');
    END

    INSERT INTO chi_tiet_su_kien(su_kien_id, tieu_de, noi_dung, thu_tu_hien_thi)
    SELECT s.su_kien_id, N'Noi dung chi tiet', N'Chi tiet su kien: ' + s.tieu_de, 1
    FROM su_kien s
    WHERE NOT EXISTS (SELECT 1 FROM chi_tiet_su_kien c WHERE c.su_kien_id = s.su_kien_id);

    INSERT INTO hinh_anh_su_kien(su_kien_id, image_url, hien_thi_trang_chu, thu_tu_hien_thi)
    SELECT s.su_kien_id, N'https://picsum.photos/seed/hinh' + CAST(s.su_kien_id AS NVARCHAR(20)) + N'/900/500', 1, 1
    FROM su_kien s
    WHERE NOT EXISTS (SELECT 1 FROM hinh_anh_su_kien h WHERE h.su_kien_id = s.su_kien_id);

    ------------------------------------------------------------
    -- 8) Ma giam gia
    ------------------------------------------------------------
    DECLARE @PhimApDung BIGINT = (SELECT TOP 1 phim_id FROM phim WHERE trang_thai = N'DANG_CHIEU' ORDER BY phim_id);
    DECLARE @LoaiVipId INT = (SELECT TOP 1 loai_thanh_vien_id FROM loai_thanh_vien WHERE ma_loai = N'VIP');

    IF NOT EXISTS (SELECT 1 FROM ma_giam_gia WHERE ma_code = N'MONDAY50')
    BEGIN
        INSERT INTO ma_giam_gia
        (
            ma_code, ten_ma, loai_giam, gia_tri_giam, ap_dung_cho,
            phim_id, loai_thanh_vien_id, so_lan_toi_da, da_su_dung,
            ngay_bat_dau, ngay_ket_thuc, trang_thai
        )
        VALUES
        (N'MONDAY50', N'Special Monday', N'SO_TIEN', 50000, N'PHIM', @PhimApDung, NULL, 1000, 0, DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, 60, GETDATE()), N'HOAT_DONG'),
        (N'VIP20', N'VIP giam 20%', N'PHAN_TRAM', 20, N'THANH_VIEN', NULL, @LoaiVipId, 9999, 0, DATEADD(DAY, -1, GETDATE()), DATEADD(DAY, 180, GETDATE()), N'HOAT_DONG');
    END

    ------------------------------------------------------------
    -- 9) Noi dung trang
    ------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM noi_dung_trang WHERE ma_trang = N'DIEU_KHOAN')
    BEGIN
        INSERT INTO noi_dung_trang(ma_trang, tieu_de, noi_dung)
        VALUES
        (N'DIEU_KHOAN', N'Dieu khoan xem phim', N'Noi dung dieu khoan xem phim...'),
        (N'BAO_MAT', N'Chinh sach bao mat', N'Noi dung chinh sach bao mat...'),
        (N'GIOI_THIEU_RAP', N'Gioi thieu rap', N'Noi dung gioi thieu rap va dich vu...');
    END

    COMMIT TRAN;
    PRINT N'Da them du lieu mau thanh cong.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;
    THROW;
END CATCH;
GO
