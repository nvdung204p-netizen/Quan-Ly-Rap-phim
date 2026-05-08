const { queryOne, exec } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");
const { sqlUniqueViolationMessage } = require("../utils/sqlErrors");
const { utcNowIso } = require("../utils/helpers");
const { TaoAccessToken } = require("../utils/jwtTokens");
const { layVaiTroTheoTaiKhoanId } = require("../services/taiKhoanRoles");

async function getHoSo(req, res) {
  const id = req.user.taiKhoanId;
  if (!id) return apiFail(res, 401, "Unauthorized");

  const row = await queryOne(
    `
        SELECT
          tai_khoan_id AS taiKhoanId,
          ho_ten AS hoTen,
          email,
          so_dien_thoai AS soDienThoai
        FROM tai_khoan
        WHERE tai_khoan_id = @id
      `,
    { id }
  );
  if (!row) return apiFail(res, 404, "Khong tim thay tai khoan.");

  const vaiTro = await layVaiTroTheoTaiKhoanId(id);
  return apiOk(res, { ...row, vaiTro });
}

async function putHoSo(req, res) {
  const id = req.user.taiKhoanId;
  if (!id) return apiFail(res, 401, "Unauthorized");

  const request = req.body || {};
  const hoTen = request.hoTen ? String(request.hoTen).trim() : "";
  if (!hoTen) return apiFail(res, 400, "Can nhap ho ten.");

  const emailRaw = request.email != null ? String(request.email).trim() : "";
  const soDtRaw = request.soDienThoai != null ? String(request.soDienThoai).trim() : "";
  const email = emailRaw || null;
  const soDienThoai = soDtRaw || null;

  if (!email && !soDienThoai) {
    return apiFail(res, 400, "Can nhap it nhat email hoac so dien thoai.");
  }

  const hienTai = await queryOne("SELECT TOP 1 tai_khoan_id AS taiKhoanId FROM tai_khoan WHERE tai_khoan_id = @id", {
    id
  });
  if (!hienTai) return apiFail(res, 404, "Khong tim thay tai khoan.");

  if (email) {
    const trungEmail = await queryOne(
      "SELECT TOP 1 1 AS x FROM tai_khoan WHERE email = @email AND tai_khoan_id <> @id",
      { email, id }
    );
    if (trungEmail) return apiFail(res, 409, "Email da duoc su dung.");
  }
  if (soDienThoai) {
    const trungSdt = await queryOne(
      "SELECT TOP 1 1 AS x FROM tai_khoan WHERE so_dien_thoai = @soDienThoai AND tai_khoan_id <> @id",
      { soDienThoai, id }
    );
    if (trungSdt) return apiFail(res, 409, "So dien thoai da duoc su dung.");
  }

  const now = utcNowIso();
  try {
    await exec(
      `
          UPDATE tai_khoan
          SET ho_ten = @hoTen, email = @email, so_dien_thoai = @soDienThoai, cap_nhat_luc = @now
          WHERE tai_khoan_id = @id
        `,
      { hoTen, email, soDienThoai, now, id }
    );
  } catch (err) {
    const u = sqlUniqueViolationMessage(err);
    if (u) return apiFail(res, 409, u);
    throw err;
  }

  const vaiTro = await layVaiTroTheoTaiKhoanId(id);
  const accessToken = TaoAccessToken(id, hoTen, vaiTro);

  return apiOk(res, {
    taiKhoanId: id,
    hoTen,
    email,
    soDienThoai,
    vaiTro,
    accessToken
  });
}

module.exports = { getHoSo, putHoSo };
