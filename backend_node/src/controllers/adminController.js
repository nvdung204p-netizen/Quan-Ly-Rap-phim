const { queryOne, queryAll, exec } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");
const { sqlUniqueViolationMessage } = require("../utils/sqlErrors");
const { utcNowIso } = require("../utils/helpers");
const { hashMatKhau } = require("../utils/password");
const { layVaiTroTheoTaiKhoanId } = require("../services/taiKhoanRoles");

async function listTaiKhoan(_req, res) {
  const rows = await queryAll(
    `
        SELECT
          tk.tai_khoan_id AS taiKhoanId,
          tk.ho_ten AS hoTen,
          tk.email,
          tk.so_dien_thoai AS soDienThoai,
          tk.trang_thai AS trangThai,
          tk.tao_luc AS taoLuc,
          STRING_AGG(CAST(vt.ma_vai_tro AS NVARCHAR(50)), N',')
            WITHIN GROUP (ORDER BY vt.ma_vai_tro) AS vaiTro
        FROM tai_khoan tk
        LEFT JOIN tai_khoan_vai_tro tvr ON tvr.tai_khoan_id = tk.tai_khoan_id
        LEFT JOIN vai_tro vt ON vt.vai_tro_id = tvr.vai_tro_id
        GROUP BY
          tk.tai_khoan_id,
          tk.ho_ten,
          tk.email,
          tk.so_dien_thoai,
          tk.trang_thai,
          tk.tao_luc
        ORDER BY tk.tao_luc DESC
      `
  );
  const mapped = rows.map((r) => ({
    ...r,
    vaiTro: r.vaiTro ? String(r.vaiTro).split(",").filter(Boolean) : []
  }));
  return apiOk(res, mapped);
}

async function createNhanVien(req, res) {
  const request = req.body || {};
  const email = request.email ? String(request.email).trim() : "";
  const soDienThoai = request.soDienThoai ? String(request.soDienThoai).trim() : "";
  const hoTen = request.hoTen ? String(request.hoTen).trim() : "";
  const matKhau = request.matKhau ? String(request.matKhau) : "";

  if (!email && !soDienThoai) return apiFail(res, 400, "Can nhap email hoac so dien thoai.");
  if (!hoTen) return apiFail(res, 400, "Can nhap ho ten.");
  if (!matKhau) return apiFail(res, 400, "Can nhap mat khau.");

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
    const insertRes = await queryOne(
      `
          INSERT INTO tai_khoan (email, so_dien_thoai, ho_ten, mat_khau_hash, trang_thai, tao_luc, cap_nhat_luc)
          OUTPUT INSERTED.tai_khoan_id AS taiKhoanId
          VALUES (@email, @soDienThoai, @hoTen, @matKhauHash, 'HOAT_DONG', @taoLuc, @capNhatLuc)
        `,
      {
        email: email || null,
        soDienThoai: soDienThoai || null,
        hoTen,
        matKhauHash: hashMatKhau(matKhau),
        taoLuc: now,
        capNhatLuc: now
      }
    );

    const taiKhoanId = Number(insertRes?.taiKhoanId);
    const vaiTroNv = await queryOne("SELECT TOP 1 vai_tro_id AS vaiTroId FROM vai_tro WHERE ma_vai_tro = N'NHAN_VIEN'", {});
    if (!vaiTroNv?.vaiTroId) return apiFail(res, 500, "Thieu cau hinh vai tro NHAN_VIEN.");

    await exec(
      `
          INSERT INTO tai_khoan_vai_tro (tai_khoan_id, vai_tro_id, tao_luc)
          VALUES (@taiKhoanId, @vaiTroId, @taoLuc)
        `,
      { taiKhoanId, vaiTroId: vaiTroNv.vaiTroId, taoLuc: now }
    );

    const vaiTro = await layVaiTroTheoTaiKhoanId(taiKhoanId);
    return apiOk(
      res,
      {
        taiKhoanId,
        hoTen,
        email: email || null,
        soDienThoai: soDienThoai || null,
        vaiTro
      },
      "Tao tai khoan nhan vien thanh cong",
      201
    );
  } catch (err) {
    const u = sqlUniqueViolationMessage(err);
    if (u) return apiFail(res, 409, u);
    throw err;
  }
}

async function patchTrangThai(req, res) {
  const id = Number(req.params.taiKhoanId);
  if (!id) return apiFail(res, 400, "Tai khoan id khong hop le.");

  const request = req.body || {};
  const trangThai = request.trangThai ? String(request.trangThai).trim().toUpperCase() : "";
  if (trangThai !== "HOAT_DONG" && trangThai !== "KHOA") {
    return apiFail(res, 400, "Trang thai chi chap nhan HOAT_DONG hoac KHOA.");
  }

  const actorId = req.user.taiKhoanId;
  if (trangThai === "KHOA" && actorId && Number(actorId) === id) {
    return apiFail(res, 400, "Khong the khoa tai khoan cua chinh ban.");
  }

  const target = await queryOne("SELECT TOP 1 tai_khoan_id AS taiKhoanId FROM tai_khoan WHERE tai_khoan_id = @id", {
    id
  });
  if (!target) return apiFail(res, 404, "Khong tim thay tai khoan.");

  if (trangThai === "KHOA") {
    const roles = await layVaiTroTheoTaiKhoanId(id);
    if (roles.includes("ADMIN")) {
      const cnt = await queryOne(
        `
            SELECT COUNT_BIG(*) AS n
            FROM tai_khoan tk
            INNER JOIN tai_khoan_vai_tro tvr ON tvr.tai_khoan_id = tk.tai_khoan_id
            INNER JOIN vai_tro vt ON vt.vai_tro_id = tvr.vai_tro_id
            WHERE vt.ma_vai_tro = N'ADMIN' AND tk.trang_thai = N'HOAT_DONG' AND tk.tai_khoan_id <> @id
          `,
        { id }
      );
      const n = cnt?.n != null ? Number(cnt.n) : 0;
      if (n < 1) return apiFail(res, 400, "Khong the khoa quan tri vien hoat dong cuoi cung.");
    }
  }

  const now = utcNowIso();
  await exec(`UPDATE tai_khoan SET trang_thai = @trangThai, cap_nhat_luc = @now WHERE tai_khoan_id = @id`, {
    trangThai,
    now,
    id
  });

  const row = await queryOne(
    `
        SELECT
          tai_khoan_id AS taiKhoanId,
          ho_ten AS hoTen,
          email,
          so_dien_thoai AS soDienThoai,
          trang_thai AS trangThai
        FROM tai_khoan
        WHERE tai_khoan_id = @id
      `,
    { id }
  );
  const vaiTro = await layVaiTroTheoTaiKhoanId(id);
  return apiOk(res, { ...row, vaiTro });
}

module.exports = {
  listTaiKhoan,
  createNhanVien,
  patchTrangThai
};
