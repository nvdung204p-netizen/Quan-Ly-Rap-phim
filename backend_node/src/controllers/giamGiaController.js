const { queryAll, queryOne, exec } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");

async function listGiamGia(req, res) {
  const rows = await queryAll(`
    SELECT
      ma_giam_gia_id AS maGiamGiaId,
      ma_code AS maCode,
      ten_ma AS moTa,
      loai_giam AS loaiGiamGia,
      gia_tri_giam AS giaTriGiam,
      ngay_bat_dau AS ngayBatDau,
      ngay_ket_thuc AS ngayKetThuc,
      so_lan_toi_da AS soLuongConLai,
      da_su_dung AS daSuDung,
      ap_dung_cho AS apDungCho,
      phim_id AS phimId,
      trang_thai AS trangThai
    FROM ma_giam_gia
    ORDER BY ngay_ket_thuc DESC
  `);
  
  // Format for frontend
  const formatted = rows.map(r => ({
    ...r,
    soLuongConLai: (r.soLuongConLai || 0) - (r.daSuDung || 0),
    loaiGiamGia: r.loaiGiamGia === 'TIEN_MAT' ? 'TRU_TIEN' : r.loaiGiamGia
  }));
  return apiOk(res, formatted);
}

async function createGiamGia(req, res) {
  const body = req.body || {};
  const maCode = (body.maCode || "").trim().toUpperCase();
  const loaiGiamGia = body.loaiGiamGia === 'TRU_TIEN' ? 'TIEN_MAT' : 'PHAN_TRAM';
  const giaTriGiam = Number(body.giaTriGiam);
  const ngayBatDau = body.ngayBatDau ? new Date(body.ngayBatDau) : null;
  const ngayKetThuc = body.ngayKetThuc ? new Date(body.ngayKetThuc) : null;
  
  if (!maCode || !giaTriGiam || !ngayBatDau || !ngayKetThuc) {
    return apiFail(res, 400, "Thieu thong tin bat buoc.");
  }

  const check = await queryOne("SELECT 1 AS x FROM ma_giam_gia WHERE ma_code = @ma", { ma: maCode });
  if (check) return apiFail(res, 409, "Ma giam gia da ton tai.");

  const tenMa = body.moTa || "Mã " + maCode;
  const soLanToiDa = Number(body.soLuongConLai) || 100;
  const phimId = body.phimId ? Number(body.phimId) : null;
  const apDungCho = phimId ? 'THEO_PHIM' : 'TOAN_HE_THONG';

  try {
    const q = `
      INSERT INTO ma_giam_gia (
        ma_code, ten_ma, loai_giam, gia_tri_giam, ap_dung_cho,
        phim_id, so_lan_toi_da, da_su_dung, ngay_bat_dau, ngay_ket_thuc, trang_thai
      ) OUTPUT INSERTED.ma_giam_gia_id AS id
      VALUES (
        @maCode, @tenMa, @loaiGiamGia, @giaTriGiam, @apDungCho,
        @phimId, @soLanToiDa, 0, @ngayBatDau, @ngayKetThuc, 'HOAT_DONG'
      )
    `;
    const result = await queryOne(q, {
      maCode, tenMa, loaiGiamGia, giaTriGiam, apDungCho, phimId, soLanToiDa, ngayBatDau, ngayKetThuc
    });
    return apiOk(res, { maGiamGiaId: result.id }, "Tao ma giam gia thanh cong", 201);
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

async function updateGiamGia(req, res) {
  const id = Number(req.params.id);
  const body = req.body || {};
  const trangThai = (body.trangThai || "HOAT_DONG").trim();
  const soLanToiDa = Number(body.soLuongConLai);
  
  if (!id) return apiFail(res, 400, "ID khong hop le.");

  try {
    await exec(
      `UPDATE ma_giam_gia SET trang_thai=@trangThai, so_lan_toi_da=@soLanToiDa WHERE ma_giam_gia_id=@id`,
      { trangThai, soLanToiDa, id }
    );
    return apiOk(res, { maGiamGiaId: id });
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

async function deleteGiamGia(req, res) {
  const id = Number(req.params.id);
  if (!id) return apiFail(res, 400, "ID khong hop le.");
  try {
    await exec(`DELETE FROM ma_giam_gia WHERE ma_giam_gia_id=@id`, { id });
    return apiOk(res, { message: "Da xoa." });
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

module.exports = {
  listGiamGia,
  createGiamGia,
  updateGiamGia,
  deleteGiamGia
};
