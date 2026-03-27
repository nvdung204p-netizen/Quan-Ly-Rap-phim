-- =========================================================
-- Seed 1 tai khoan ADMIN (dung cho dev / test)
-- =========================================================
-- Mat khau PLAIN TEXT: Admin@123
-- Hash duoc tao bang PBKDF2-HMAC-SHA256, 100000 vong, salt 16 byte, output 32 byte
-- (cung thuat toan voi BaoMatService.HashMatKhau trong backend)
--
-- Chay script nay SAU KHI da chay BangChinh.sql / thiet_ke_co_so_du_lieu_rap_phim.sql
-- (bang vai_tro phai co dong ma_vai_tro = N'ADMIN')
-- =========================================================

USE QuanLyRapChieuPhim;
GO

SET NOCOUNT ON;

DECLARE @Email NVARCHAR(255) = N'admin@ncc.local';
DECLARE @MatKhauHash NVARCHAR(500) = N'100000.mIC76JXw6fM3xca9T/DiGQ==.tWddJoFsh/YXFXt9tCaG0uyHHU6jbjUoThNFOKFoQiY=';
DECLARE @HoTen NVARCHAR(200) = N'Quan tri vien';
DECLARE @VaiTroId INT;

SELECT @VaiTroId = vai_tro_id
FROM vai_tro
WHERE ma_vai_tro = N'ADMIN';

IF @VaiTroId IS NULL
BEGIN
    RAISERROR(N'Khong tim thay vai tro ADMIN trong bang vai_tro.', 16, 1);
    RETURN;
END

IF EXISTS (SELECT 1 FROM tai_khoan WHERE email = @Email)
BEGIN
    PRINT N'Tai khoan da ton tai: ' + @Email + N' (bo qua insert).';
END
ELSE
BEGIN
    INSERT INTO tai_khoan (
        email,
        so_dien_thoai,
        mat_khau_hash,
        ho_ten,
        trang_thai,
        tao_luc,
        cap_nhat_luc
    )
    VALUES (
        @Email,
        NULL,
        @MatKhauHash,
        @HoTen,
        N'HOAT_DONG',
        SYSDATETIME(),
        SYSDATETIME()
    );

    DECLARE @TaiKhoanId BIGINT = SCOPE_IDENTITY();

    IF NOT EXISTS (
        SELECT 1 FROM tai_khoan_vai_tro
        WHERE tai_khoan_id = @TaiKhoanId AND vai_tro_id = @VaiTroId
    )
    BEGIN
        INSERT INTO tai_khoan_vai_tro (tai_khoan_id, vai_tro_id, tao_luc)
        VALUES (@TaiKhoanId, @VaiTroId, SYSDATETIME());
    END

    PRINT N'Da tao tai khoan admin: ' + @Email + N' (mat khau: Admin@123)';
END
GO
