const { queryOne, queryAll, exec } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");

async function listSuKien(_req, res) {
  const rows = await queryAll(
    `
        SELECT
          su_kien_id AS suKienId,
          tieu_de AS tieuDe,
          mo_ta_ngan AS moTaNgan,
          noi_dung AS noiDung,
          anh_dai_dien_url AS anhDaiDienUrl,
          hien_thi_trang_chu AS hienThiTrangChu,
          ngay_bat_dau AS ngayBatDau,
          ngay_ket_thuc AS ngayKetThuc,
          trang_thai AS trangThai,
          tao_luc AS taoLuc
        FROM su_kien
        ORDER BY tao_luc DESC
      `
  );
  return apiOk(res, rows);
}
async function getSuKienById(req, res) {
  const id = Number(req.params.id);
  if (!id) return apiFail(res, 400, "ID khong hop le.");
  const row = await queryOne(
    `
        SELECT
          su_kien_id AS suKienId,
          tieu_de AS tieuDe,
          mo_ta_ngan AS moTaNgan,
          noi_dung AS noiDung,
          anh_dai_dien_url AS anhDaiDienUrl,
          hien_thi_trang_chu AS hienThiTrangChu,
          ngay_bat_dau AS ngayBatDau,
          ngay_ket_thuc AS ngayKetThuc,
          trang_thai AS trangThai,
          tao_luc AS taoLuc
        FROM su_kien
        WHERE su_kien_id = @id
      `,
    { id }
  );
  if (!row) return apiFail(res, 404, "Khong tim thay su kien.");
  return apiOk(res, row);
}
async function createSuKien(req, res) {
  const body = req.body || {};
  const tieuDe = (body.tieuDe || "").trim();
  const moTaNgan = (body.moTaNgan || "").trim();
  const noiDung = (body.noiDung || "").trim();
  const anhDaiDienUrl = (body.anhDaiDienUrl || "").trim();
  const hienThiTrangChu = body.hienThiTrangChu ? 1 : 0;
  const ngayBatDau = body.ngayBatDau ? new Date(body.ngayBatDau) : null;
  const ngayKetThuc = body.ngayKetThuc ? new Date(body.ngayKetThuc) : null;

  if (!tieuDe) return apiFail(res, 400, "Tieu de khong duoc de trong.");

  try {
    const q = `
      INSERT INTO su_kien (tieu_de, mo_ta_ngan, noi_dung, anh_dai_dien_url, hien_thi_trang_chu, ngay_bat_dau, ngay_ket_thuc, trang_thai)
      OUTPUT INSERTED.su_kien_id AS id
      VALUES (@tieuDe, @moTaNgan, @noiDung, @anhDaiDienUrl, @hienThiTrangChu, @ngayBatDau, @ngayKetThuc, 'HOAT_DONG')
    `;
    const result = await queryOne(q, { tieuDe, moTaNgan, noiDung, anhDaiDienUrl, hienThiTrangChu, ngayBatDau, ngayKetThuc });
    return apiOk(res, { suKienId: result.id }, "Tao su kien thanh cong", 201);
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

async function updateSuKien(req, res) {
  const id = Number(req.params.id);
  const body = req.body || {};
  const tieuDe = (body.tieuDe || "").trim();
  const moTaNgan = (body.moTaNgan || "").trim();
  const noiDung = (body.noiDung || "").trim();
  const anhDaiDienUrl = (body.anhDaiDienUrl || "").trim();
  const hienThiTrangChu = body.hienThiTrangChu ? 1 : 0;
  const ngayBatDau = body.ngayBatDau ? new Date(body.ngayBatDau) : null;
  const ngayKetThuc = body.ngayKetThuc ? new Date(body.ngayKetThuc) : null;
  const trangThai = (body.trangThai || "HOAT_DONG").trim();

  if (!id || !tieuDe) return apiFail(res, 400, "Thieu thong tin.");

  try {
    await exec(`
      UPDATE su_kien SET
        tieu_de = @tieuDe, mo_ta_ngan = @moTaNgan, noi_dung = @noiDung,
        anh_dai_dien_url = @anhDaiDienUrl, hien_thi_trang_chu = @hienThiTrangChu,
        ngay_bat_dau = @ngayBatDau, ngay_ket_thuc = @ngayKetThuc, trang_thai = @trangThai, cap_nhat_luc = SYSUTCDATETIME()
      WHERE su_kien_id = @id
    `, { tieuDe, moTaNgan, noiDung, anhDaiDienUrl, hienThiTrangChu, ngayBatDau, ngayKetThuc, trangThai, id });
    return apiOk(res, { suKienId: id });
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

async function deleteSuKien(req, res) {
  const id = Number(req.params.id);
  if (!id) return apiFail(res, 400, "ID khong hop le.");
  try {
    await exec(`DELETE FROM su_kien WHERE su_kien_id = @id`, { id });
    return apiOk(res, { message: "Da xoa su kien." });
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

module.exports = {
  listSuKien,
  getSuKienById,
  createSuKien,
  updateSuKien,
  deleteSuKien
};
