const { queryAll, queryOne, exec } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");

async function listNganHang(req, res) {
  const rows = await queryAll(`
    SELECT
      tai_khoan_ngan_hang_id AS nganHangId,
      ten_ngan_hang AS tenNganHang,
      ten_chu_tai_khoan AS chuTaiKhoan,
      so_tai_khoan AS soTaiKhoan,
      chi_nhanh AS chiNhanh,
      ghi_chu AS logoUrl,
      hoat_dong AS hoatDong,
      thu_tu AS thuTu
    FROM tai_khoan_ngan_hang
    ORDER BY thu_tu DESC, tai_khoan_ngan_hang_id ASC
  `);
  
  // Mapping to frontend model
  const formatted = rows.map(r => ({
    ...r,
    laMacDinh: r.thuTu === 1,
    trangThai: r.hoatDong ? "HOAT_DONG" : "NGUNG"
  }));
  return apiOk(res, formatted);
}

async function createNganHang(req, res) {
  const body = req.body || {};
  const tenNganHang = (body.tenNganHang || "").trim();
  const chuTaiKhoan = (body.chuTaiKhoan || "").trim();
  const soTaiKhoan = (body.soTaiKhoan || "").trim();
  const chiNhanh = (body.chiNhanh || "").trim();
  const logoUrl = (body.logoUrl || "").trim();
  const thuTu = body.laMacDinh ? 1 : 0;

  if (!tenNganHang || !chuTaiKhoan || !soTaiKhoan) {
    return apiFail(res, 400, "Thieu thong tin ngan hang, chu tai khoan, hoac so tai khoan.");
  }

  try {
    if (thuTu === 1) {
      await exec(`UPDATE tai_khoan_ngan_hang SET thu_tu = 0`);
    }

    const q = `
      INSERT INTO tai_khoan_ngan_hang (ten_ngan_hang, ten_chu_tai_khoan, so_tai_khoan, chi_nhanh, ghi_chu, thu_tu, hoat_dong)
      OUTPUT INSERTED.tai_khoan_ngan_hang_id AS id
      VALUES (@tenNganHang, @chuTaiKhoan, @soTaiKhoan, @chiNhanh, @logoUrl, @thuTu, 1)
    `;
    const result = await queryOne(q, { tenNganHang, chuTaiKhoan, soTaiKhoan, chiNhanh, logoUrl, thuTu });
    return apiOk(res, { nganHangId: result.id }, "Tao tai khoan ngan hang thanh cong", 201);
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

async function updateNganHang(req, res) {
  const id = Number(req.params.id);
  const body = req.body || {};
  const tenNganHang = (body.tenNganHang || "").trim();
  const chuTaiKhoan = (body.chuTaiKhoan || "").trim();
  const soTaiKhoan = (body.soTaiKhoan || "").trim();
  const chiNhanh = (body.chiNhanh || "").trim();
  const logoUrl = (body.logoUrl || "").trim();
  const thuTu = body.laMacDinh ? 1 : 0;
  const hoatDong = body.trangThai === "NGUNG" ? 0 : 1;

  if (!id || !tenNganHang || !chuTaiKhoan || !soTaiKhoan) {
    return apiFail(res, 400, "Thieu thong tin bat buoc.");
  }

  try {
    if (thuTu === 1) {
      await exec(`UPDATE tai_khoan_ngan_hang SET thu_tu = 0 WHERE tai_khoan_ngan_hang_id <> @id`, { id });
    }

    await exec(`
      UPDATE tai_khoan_ngan_hang SET
        ten_ngan_hang = @tenNganHang, ten_chu_tai_khoan = @chuTaiKhoan, so_tai_khoan = @soTaiKhoan,
        chi_nhanh = @chiNhanh, ghi_chu = @logoUrl, thu_tu = @thuTu, hoat_dong = @hoatDong
      WHERE tai_khoan_ngan_hang_id = @id
    `, { tenNganHang, chuTaiKhoan, soTaiKhoan, chiNhanh, logoUrl, thuTu, hoatDong, id });
    
    return apiOk(res, { nganHangId: id });
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

async function deleteNganHang(req, res) {
  const id = Number(req.params.id);
  if (!id) return apiFail(res, 400, "ID khong hop le.");
  try {
    await exec(`DELETE FROM tai_khoan_ngan_hang WHERE tai_khoan_ngan_hang_id = @id`, { id });
    return apiOk(res, { message: "Da xoa ngan hang." });
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

module.exports = {
  listNganHang,
  createNganHang,
  updateNganHang,
  deleteNganHang
};
