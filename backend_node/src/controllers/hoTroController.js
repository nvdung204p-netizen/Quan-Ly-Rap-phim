const { queryAll, queryOne, exec } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");

async function listKenhHoTro(req, res) {
  const rows = await queryAll(`
    SELECT
      kenh_lien_he_id AS phuongThucId,
      ten_kenh AS tenPhuongThuc,
      gia_tri AS giaTriHienThi,
      bieu_tuong AS iconUrl,
      hoat_dong AS trangThai,
      thu_tu AS thuTu,
      link_dich AS linkDich
    FROM kenh_lien_he
    ORDER BY thu_tu ASC
  `);
  return apiOk(res, rows);
}

async function createKenhHoTro(req, res) {
  const body = req.body || {};
  const tenPhuongThuc = (body.tenPhuongThuc || "").trim();
  const giaTriHienThi = (body.giaTriHienThi || "").trim();
  const iconUrl = (body.iconUrl || "").trim();
  const thuTu = Number(body.thuTu) || 0;

  if (!tenPhuongThuc || !giaTriHienThi) {
    return apiFail(res, 400, "Ten phuong thuc va gia tri hien thi khong duoc de trong.");
  }

  try {
    const q = `
      INSERT INTO kenh_lien_he (ten_kenh, gia_tri, bieu_tuong, thu_tu, hoat_dong, link_dich)
      OUTPUT INSERTED.kenh_lien_he_id AS id
      VALUES (@tenPhuongThuc, @giaTriHienThi, @iconUrl, @thuTu, 1, @linkDich)
    `;
    const result = await queryOne(q, { tenPhuongThuc, giaTriHienThi, iconUrl, thuTu, linkDich: (body.linkDich || "").trim() });
    return apiOk(res, { phuongThucId: result.id }, "Tao kenh ho tro thanh cong", 201);
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

async function updateKenhHoTro(req, res) {
  const id = Number(req.params.id);
  const body = req.body || {};
  const tenPhuongThuc = (body.tenPhuongThuc || "").trim();
  const giaTriHienThi = (body.giaTriHienThi || "").trim();
  const iconUrl = (body.iconUrl || "").trim();
  const thuTu = Number(body.thuTu) || 0;
  const hoatDong = body.trangThai === 0 ? 0 : 1;

  if (!id || !tenPhuongThuc || !giaTriHienThi) return apiFail(res, 400, "Thieu thong tin.");

  try {
    await exec(`
      UPDATE kenh_lien_he SET
        ten_kenh = @tenPhuongThuc, gia_tri = @giaTriHienThi,
        bieu_tuong = @iconUrl, thu_tu = @thuTu, hoat_dong = @hoatDong, link_dich = @linkDich
      WHERE kenh_lien_he_id = @id
    `, { tenPhuongThuc, giaTriHienThi, iconUrl, thuTu, hoatDong, linkDich: (body.linkDich || "").trim(), id });
    return apiOk(res, { phuongThucId: id });
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

async function deleteKenhHoTro(req, res) {
  const id = Number(req.params.id);
  if (!id) return apiFail(res, 400, "ID khong hop le.");
  try {
    await exec(`DELETE FROM kenh_lien_he WHERE kenh_lien_he_id = @id`, { id });
    return apiOk(res, { message: "Da xoa kenh ho tro." });
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

module.exports = {
  listKenhHoTro,
  createKenhHoTro,
  updateKenhHoTro,
  deleteKenhHoTro
};
