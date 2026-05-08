const { queryOne, queryAll, exec } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");
const { sqlUniqueViolationMessage } = require("../utils/sqlErrors");
const { TaoOtp, utcNowIso } = require("../utils/helpers");
const { hashMatKhau, KiemTraMatKhau } = require("../utils/password");
const { TaoAccessToken } = require("../utils/jwtTokens");

async function dangKy(req, res) {
  const request = req.body || {};
  const email = request.email ? String(request.email).trim() : "";
  const soDienThoai = request.soDienThoai ? String(request.soDienThoai).trim() : "";
  const hoTen = request.hoTen;
  const matKhau = request.matKhau;

  if (!email && !soDienThoai) return apiFail(res, 400, "Can nhap email hoac so dien thoai.");
  if (!hoTen || !String(hoTen).trim()) return apiFail(res, 400, "Can nhap ho ten.");
  if (!matKhau || !String(matKhau)) return apiFail(res, 400, "Can nhap mat khau.");

  try {
    if (email) {
      const exists = await queryOne("SELECT TOP 1 1 AS x FROM tai_khoan WHERE email = @email", { email });
      if (exists) return apiFail(res, 409, "Email da duoc su dung.");
    }
    if (soDienThoai) {
      const exists = await queryOne("SELECT TOP 1 1 AS x FROM tai_khoan WHERE so_dien_thoai = @soDienThoai", {
        soDienThoai
      });
      if (exists) return apiFail(res, 409, "So dien thoai da duoc su dung.");
    }

    const now = utcNowIso();
    const taiKhoanInsertSql = `
      INSERT INTO tai_khoan (email, so_dien_thoai, ho_ten, mat_khau_hash, trang_thai, tao_luc, cap_nhat_luc)
      OUTPUT INSERTED.tai_khoan_id AS taiKhoanId
      VALUES (@email, @soDienThoai, @hoTen, @matKhauHash, 'HOAT_DONG', @taoLuc, @capNhatLuc)
    `;

    const insertRes = await queryOne(taiKhoanInsertSql, {
      email: email || null,
      soDienThoai: soDienThoai || null,
      hoTen: String(hoTen).trim(),
      matKhauHash: hashMatKhau(String(matKhau)),
      taoLuc: now,
      capNhatLuc: now
    });

    const taiKhoanId = Number(insertRes?.taiKhoanId);

    const vaiTroKhach = await queryOne(
      "SELECT TOP 1 vai_tro_id AS vaiTroId FROM vai_tro WHERE ma_vai_tro = 'KHACH_HANG'",
      {}
    );
    if (vaiTroKhach?.vaiTroId) {
      await exec(
        `
          INSERT INTO tai_khoan_vai_tro (tai_khoan_id, vai_tro_id, tao_luc)
          VALUES (@taiKhoanId, @vaiTroId, @taoLuc)
        `,
        { taiKhoanId, vaiTroId: vaiTroKhach.vaiTroId, taoLuc: now }
      );
    }

    const vaiTroList = await queryAll(
      `
        SELECT vt.ma_vai_tro AS role
        FROM tai_khoan_vai_tro tvr
        JOIN vai_tro vt ON vt.vai_tro_id = tvr.vai_tro_id
        WHERE tvr.tai_khoan_id = @taiKhoanId
      `,
      { taiKhoanId }
    );
    const roles = vaiTroList.map((x) => x.role);

    const token = TaoAccessToken(taiKhoanId, String(hoTen).trim(), roles);

    return apiOk(res, {
      taiKhoanId,
      hoTen: String(hoTen).trim(),
      email: email || null,
      soDienThoai: soDienThoai || null,
      accessToken: token,
      vaiTro: roles
    });
  } catch (err) {
    const u = sqlUniqueViolationMessage(err);
    if (u) return apiFail(res, 409, u);
    throw err;
  }
}

async function dangNhap(req, res) {
  const request = req.body || {};
  const accountKey = request.emailOrSoDienThoai ? String(request.emailOrSoDienThoai).trim() : "";
  const matKhau = request.matKhau ? String(request.matKhau) : "";

  if (!accountKey) return apiFail(res, 400, "Can nhap email hoac so dien thoai.");

  const taiKhoan = await queryOne(
    `
        SELECT TOP 1 *
        FROM tai_khoan
        WHERE email = @accountKey OR so_dien_thoai = @accountKey
      `,
    { accountKey }
  );

  if (!taiKhoan) return apiFail(res, 401, "Thong tin dang nhap khong dung.");
  const okPass = KiemTraMatKhau(matKhau, taiKhoan.mat_khau_hash);
  if (!okPass) return apiFail(res, 401, "Thong tin dang nhap khong dung.");
  if (taiKhoan.trang_thai !== "HOAT_DONG") return apiFail(res, 400, "Tai khoan khong hoat dong.");

  const vaiTroRows = await queryAll(
    `
        SELECT vt.ma_vai_tro AS role
        FROM tai_khoan_vai_tro tvr
        JOIN vai_tro vt ON vt.vai_tro_id = tvr.vai_tro_id
        WHERE tvr.tai_khoan_id = @taiKhoanId
      `,
    { taiKhoanId: taiKhoan.tai_khoan_id }
  );
  const roles = vaiTroRows.map((x) => x.role);

  const token = TaoAccessToken(taiKhoan.tai_khoan_id, taiKhoan.ho_ten, roles);

  return apiOk(res, {
    taiKhoanId: taiKhoan.tai_khoan_id,
    hoTen: taiKhoan.ho_ten,
    email: taiKhoan.email,
    soDienThoai: taiKhoan.so_dien_thoai,
    accessToken: token,
    vaiTro: roles
  });
}

async function quenMatKhauGuiOtp(req, res) {
  const request = req.body || {};
  const email = request.email ? String(request.email).trim() : "";
  const soDienThoai = request.soDienThoai ? String(request.soDienThoai).trim() : "";

  if (!email && !soDienThoai) return apiFail(res, 400, "Can nhap email hoac so dien thoai.");

  const taiKhoan = await queryOne(
    `
        SELECT TOP 1 *
        FROM tai_khoan
        WHERE
          (@email IS NOT NULL AND LTRIM(RTRIM(@email)) <> '' AND email = @email)
          OR
          (@soDienThoai IS NOT NULL AND LTRIM(RTRIM(@soDienThoai)) <> '' AND so_dien_thoai = @soDienThoai)
      `,
    { email: email || null, soDienThoai: soDienThoai || null }
  );

  if (!taiKhoan) return apiFail(res, 404, "Khong tim thay tai khoan.");

  const otp = TaoOtp(6);
  const now = utcNowIso();
  const hetHanLuc = new Date(now.getTime() + 5 * 60 * 1000);

  const insertSql = `
      INSERT INTO ma_xac_thuc_otp (tai_khoan_id, email, so_dien_thoai, ma_otp, muc_dich, het_han_luc, da_su_dung, tao_luc)
      VALUES (@taiKhoanId, @email, @soDienThoai, @maOtp, 'QUEN_MAT_KHAU', @hetHanLuc, 0, @taoLuc)
    `;

  await exec(insertSql, {
    taiKhoanId: taiKhoan.tai_khoan_id,
    email: email || taiKhoan.email,
    soDienThoai: soDienThoai || taiKhoan.so_dien_thoai,
    maOtp: otp,
    hetHanLuc,
    taoLuc: now
  });

  return apiOk(res, {
    message: "Da tao OTP. (Ban dev: tra OTP de test Swagger)",
    otp,
    hetHanLuc
  });
}

async function quenMatKhauDatLai(req, res) {
  const request = req.body || {};
  const email = request.email ? String(request.email).trim() : "";
  const soDienThoai = request.soDienThoai ? String(request.soDienThoai).trim() : "";

  if (!email && !soDienThoai) return apiFail(res, 400, "Can nhap email hoac so dien thoai.");

  const otpCode = request.otp ? String(request.otp).trim() : "";
  const matKhauMoi = request.matKhauMoi ? String(request.matKhauMoi) : "";
  if (!otpCode) return apiFail(res, 400, "OTP khong hop le hoac da het han.");
  if (!matKhauMoi) return apiFail(res, 400, "Can nhap mat khau moi.");

  const now = utcNowIso();

  const otpRow = await queryOne(
    `
        SELECT TOP 1 *
        FROM ma_xac_thuc_otp
        WHERE muc_dich = 'QUEN_MAT_KHAU'
          AND ma_otp = @otp
          AND da_su_dung = 0
          AND het_han_luc >= @now
          AND (
            (@email IS NOT NULL AND LTRIM(RTRIM(@email)) <> '' AND email = @email)
            OR
            (@soDienThoai IS NOT NULL AND LTRIM(RTRIM(@soDienThoai)) <> '' AND so_dien_thoai = @soDienThoai)
          )
        ORDER BY tao_luc DESC
      `,
    {
      otp: otpCode,
      now,
      email: email || null,
      soDienThoai: soDienThoai || null
    }
  );

  if (!otpRow) return apiFail(res, 400, "OTP khong hop le hoac da het han.");

  const taiKhoan = await queryOne("SELECT TOP 1 * FROM tai_khoan WHERE tai_khoan_id = @taiKhoanId", {
    taiKhoanId: otpRow.tai_khoan_id
  });
  if (!taiKhoan) return apiFail(res, 404, "Khong tim thay tai khoan.");

  const newHash = hashMatKhau(matKhauMoi);
  await exec(
    `
        UPDATE tai_khoan
        SET mat_khau_hash = @matKhauHash,
            cap_nhat_luc = @capNhatLuc
        WHERE tai_khoan_id = @taiKhoanId
      `,
    { matKhauHash: newHash, capNhatLuc: now, taiKhoanId: taiKhoan.tai_khoan_id }
  );

  await exec(
    `
        UPDATE ma_xac_thuc_otp
        SET da_su_dung = 1
        WHERE ma_xac_thuc_otp_id = @otpId
      `,
    { otpId: otpRow.ma_xac_thuc_otp_id }
  );

  return apiOk(res, "Dat lai mat khau thanh cong.");
}

module.exports = {
  dangKy,
  dangNhap,
  quenMatKhauGuiOtp,
  quenMatKhauDatLai
};
