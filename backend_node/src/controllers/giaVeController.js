const { queryAll, queryOne, exec } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");

async function listGiaVePhim(_req, res) {
  const rows = await queryAll(
    `SELECT gia_ve_phim_id AS giaVePhimId, phim_id AS phimId, gia_co_ban AS giaCoBan, tu_ngay AS tuNgay, den_ngay AS denNgay FROM gia_ve_phim ORDER BY tu_ngay DESC`
  );
  return apiOk(res, rows);
}

async function getGiaVePhim(req, res) {
  const id = Number(req.params.id);
  if (!id) return apiFail(res, 400, "ID khong hop le.");
  const row = await queryOne(
    `SELECT gia_ve_phim_id AS giaVePhimId, phim_id AS phimId, gia_co_ban AS giaCoBan, tu_ngay AS tuNgay, den_ngay AS denNgay FROM gia_ve_phim WHERE gia_ve_phim_id = @id`,
    { id }
  );
  if (!row) return apiFail(res, 404, "Khong tim thay.");
  return apiOk(res, row);
}

async function createGiaVePhim(req, res) {
  const body = req.body || {};
  const phimId = Number(body.phimId);
  const giaCoBan = Number(body.giaCoBan);
  const tuNgay = body.tuNgay ? body.tuNgay.trim() : null;
  const denNgay = body.denNgay ? body.denNgay.trim() : null;

  if (!phimId || !giaCoBan || !tuNgay) return apiFail(res, 400, "Thieu thong tin bat buoc.");

  try {
    const q = `INSERT INTO gia_ve_phim (phim_id, gia_co_ban, tu_ngay, den_ngay) OUTPUT INSERTED.gia_ve_phim_id VALUES (@phimId, @giaCoBan, @tuNgay, @denNgay)`;
    const result = await queryOne(q, { phimId, giaCoBan, tuNgay, denNgay });
    return apiOk(res, { giaVePhimId: result.gia_ve_phim_id }, "Tao gia ve thanh cong", 201);
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

async function updateGiaVePhim(req, res) {
  const id = Number(req.params.id);
  const body = req.body || {};
  const phimId = Number(body.phimId);
  const giaCoBan = Number(body.giaCoBan);
  const tuNgay = body.tuNgay ? body.tuNgay.trim() : null;
  const denNgay = body.denNgay ? body.denNgay.trim() : null;

  if (!id || !phimId || !giaCoBan || !tuNgay) return apiFail(res, 400, "Thieu thong tin bat buoc.");

  try {
    await exec(
      `UPDATE gia_ve_phim SET phim_id=@phimId, gia_co_ban=@giaCoBan, tu_ngay=@tuNgay, den_ngay=@denNgay WHERE gia_ve_phim_id=@id`,
      { phimId, giaCoBan, tuNgay, denNgay, id }
    );
    return apiOk(res, { giaVePhimId: id });
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

async function deleteGiaVePhim(req, res) {
  const id = Number(req.params.id);
  if (!id) return apiFail(res, 400, "ID khong hop le.");
  try {
    await exec(`DELETE FROM gia_ve_phim WHERE gia_ve_phim_id=@id`, { id });
    return apiOk(res, { message: "Da xoa." });
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

async function listLoaiGhe(_req, res) {
  const rows = await queryAll(
    `SELECT loai_ghe_id AS loaiGheId, ma_loai AS maLoai, ten_loai AS tenLoai, he_so_gia AS heSoGia, mau_hien_thi AS mauHienThi FROM loai_ghe ORDER BY he_so_gia ASC`
  );
  return apiOk(res, rows);
}

async function updateLoaiGhe(req, res) {
  const id = Number(req.params.id);
  const body = req.body || {};
  const heSoGia = Number(body.heSoGia);
  const mauHienThi = body.mauHienThi ? body.mauHienThi.trim() : null;

  if (!id || !heSoGia) return apiFail(res, 400, "Thieu thong tin.");

  try {
    await exec(`UPDATE loai_ghe SET he_so_gia=@heSoGia, mau_hien_thi=@mauHienThi WHERE loai_ghe_id=@id`, { heSoGia, mauHienThi, id });
    return apiOk(res, { loaiGheId: id });
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

module.exports = {
  listGiaVePhim,
  getGiaVePhim,
  createGiaVePhim,
  updateGiaVePhim,
  deleteGiaVePhim,
  listLoaiGhe,
  updateLoaiGhe
};
