const { queryOne, queryAll, exec } = require("../db/queries");
const { getPool, sql } = require("../db/pool");
const { apiOk, apiFail } = require("../utils/apiResponse");
const { utcNowIso } = require("../utils/helpers");

async function listPhim(_req, res) {
  const rows = await queryAll(
    `
        SELECT
          phim_id AS phimId,
          ten_phim AS tenPhim,
          the_loai AS theLoai,
          dao_dien AS daoDien,
          dien_vien AS dienVien,
          thoi_luong_phut AS thoiLuongPhut,
          gioi_han_tuoi AS gioiHanTuoi,
          ngay_khoi_chieu AS ngayKhoiChieu,
          ngon_ngu AS ngonNgu,
          quoc_gia AS quocGia,
          mo_ta AS moTa,
          poster_url AS posterUrl,
          trailer_url AS trailerUrl,
          trang_thai AS trangThai,
          tao_luc AS taoLuc,
          cap_nhat_luc AS capNhatLuc
        FROM phim
        ORDER BY tao_luc DESC
      `
  );
  return apiOk(res, rows);
}

async function listPhimHot(_req, res) {
  const rows = await queryAll(
    `
        SELECT
          phim_hot_id AS phimHotId,
          phim_id AS phimId,
          thu_tu_hien_thi AS thuTuHienThi,
          tu_ngay AS tuNgay,
          den_ngay AS denNgay
        FROM phim_hot
        ORDER BY thu_tu_hien_thi ASC
      `
  );
  return apiOk(res, rows);
}

async function getPhimById(req, res) {
  const id = Number(req.params.id);
  const row = await queryOne(
    `
        SELECT
          phim_id AS phimId,
          ten_phim AS tenPhim,
          the_loai AS theLoai,
          dao_dien AS daoDien,
          dien_vien AS dienVien,
          thoi_luong_phut AS thoiLuongPhut,
          gioi_han_tuoi AS gioiHanTuoi,
          ngay_khoi_chieu AS ngayKhoiChieu,
          ngon_ngu AS ngonNgu,
          quoc_gia AS quocGia,
          mo_ta AS moTa,
          poster_url AS posterUrl,
          trailer_url AS trailerUrl,
          trang_thai AS trangThai,
          tao_luc AS taoLuc,
          cap_nhat_luc AS capNhatLuc
        FROM phim
        WHERE phim_id = @id
      `,
    { id }
  );

  if (!row) return apiFail(res, 404, "Yeu cau khong hop le");
  return apiOk(res, row);
}

async function listGioiThieu(req, res) {
  const phimId = Number(req.params.phimId);
  const rows = await queryAll(
    `
        SELECT
          gioi_thieu_phim_id AS gioiThieuPhimId,
          phim_id AS phimId,
          noi_dung AS noiDung,
          tao_luc AS taoLuc,
          cap_nhat_luc AS capNhatLuc
        FROM gioi_thieu_phim
        WHERE phim_id = @phimId
        ORDER BY cap_nhat_luc DESC
      `,
    { phimId }
  );
  return apiOk(res, rows);
}

async function listTrailer(req, res) {
  const phimId = Number(req.params.phimId);
  const rows = await queryAll(
    `
        SELECT
          trailer_phim_id AS trailerPhimId,
          phim_id AS phimId,
          tieu_de AS tieuDe,
          trailer_url AS trailerUrl,
          thu_tu_hien_thi AS thuTuHienThi,
          tao_luc AS taoLuc
        FROM trailer_phim
        WHERE phim_id = @phimId
        ORDER BY thu_tu_hien_thi ASC
      `,
    { phimId }
  );
  return apiOk(res, rows);
}

async function createPhim(req, res) {
  const request = req.body || {};
  const now = utcNowIso();

  const tenPhim = request.tenPhim ? String(request.tenPhim).trim() : "";
  if (!tenPhim) return apiFail(res, 400, "Can nhap ten phim.");

  const trangThai = request.trangThai && String(request.trangThai).trim() ? String(request.trangThai).trim() : "SAP_CHIEU";
  const thoiLuongPhut = request.thoiLuongPhut !== "" && request.thoiLuongPhut != null ? Number(request.thoiLuongPhut) : null;
  const ngayKhoiChieu = request.ngayKhoiChieu && String(request.ngayKhoiChieu).trim() ? new Date(request.ngayKhoiChieu) : null;

  const insertRes = await queryOne(
    `
        INSERT INTO phim (
          ten_phim,
          the_loai,
          dao_dien,
          dien_vien,
          thoi_luong_phut,
          gioi_han_tuoi,
          ngay_khoi_chieu,
          ngon_ngu,
          quoc_gia,
          mo_ta,
          poster_url,
          trailer_url,
          trang_thai,
          tao_luc,
          cap_nhat_luc
        )
        OUTPUT INSERTED.phim_id AS phimId
        VALUES (
          @tenPhim,
          @theLoai,
          @daoDien,
          @dienVien,
          @thoiLuongPhut,
          @gioiHanTuoi,
          @ngayKhoiChieu,
          @ngonNgu,
          @quocGia,
          @moTa,
          @posterUrl,
          @trailerUrl,
          @trangThai,
          @taoLuc,
          @capNhatLuc
        )
      `,
    {
      tenPhim,
      theLoai: request.theLoai || null,
      daoDien: request.daoDien || null,
      dienVien: request.dienVien || null,
      thoiLuongPhut,
      gioiHanTuoi: request.gioiHanTuoi || null,
      ngayKhoiChieu,
      ngonNgu: request.ngonNgu || null,
      quocGia: request.quocGia || null,
      moTa: request.moTa || null,
      posterUrl: request.posterUrl || null,
      trailerUrl: request.trailerUrl || null,
      trangThai,
      taoLuc: now,
      capNhatLuc: now
    }
  );

  const phimId = Number(insertRes?.phimId);
  const row = await getPhimByIdInternal(phimId);
  return apiOk(res, row, "Thanh cong", 201);
}

async function getPhimByIdInternal(id) {
  return await queryOne(
    `
        SELECT
          phim_id AS phimId,
          ten_phim AS tenPhim,
          the_loai AS theLoai,
          dao_dien AS daoDien,
          dien_vien AS dienVien,
          thoi_luong_phut AS thoiLuongPhut,
          gioi_han_tuoi AS gioiHanTuoi,
          ngay_khoi_chieu AS ngayKhoiChieu,
          ngon_ngu AS ngonNgu,
          quoc_gia AS quocGia,
          mo_ta AS moTa,
          poster_url AS posterUrl,
          trailer_url AS trailerUrl,
          trang_thai AS trangThai,
          tao_luc AS taoLuc,
          cap_nhat_luc AS capNhatLuc
        FROM phim
        WHERE phim_id = @id
      `,
    { id }
  );
}

async function updatePhim(req, res) {
  const phimId = Number(req.params.phimId);
  if (!phimId) return apiFail(res, 400, "Phim id khong hop le.");

  const exists = await queryOne("SELECT TOP 1 phim_id AS phimId FROM phim WHERE phim_id = @phimId", { phimId });
  if (!exists) return apiFail(res, 404, "Khong tim thay phim.");

  const request = req.body || {};
  const now = utcNowIso();

  const tenPhim = request.tenPhim ? String(request.tenPhim).trim() : "";
  if (!tenPhim) return apiFail(res, 400, "Can nhap ten phim.");

  const trangThai = request.trangThai && String(request.trangThai).trim() ? String(request.trangThai).trim() : "SAP_CHIEU";
  const thoiLuongPhut = request.thoiLuongPhut !== "" && request.thoiLuongPhut != null ? Number(request.thoiLuongPhut) : null;
  const ngayKhoiChieu = request.ngayKhoiChieu && String(request.ngayKhoiChieu).trim() ? new Date(request.ngayKhoiChieu) : null;

  await exec(
    `
        UPDATE phim SET
          ten_phim = @tenPhim,
          the_loai = @theLoai,
          dao_dien = @daoDien,
          dien_vien = @dienVien,
          thoi_luong_phut = @thoiLuongPhut,
          gioi_han_tuoi = @gioiHanTuoi,
          ngay_khoi_chieu = @ngayKhoiChieu,
          ngon_ngu = @ngonNgu,
          quoc_gia = @quocGia,
          mo_ta = @moTa,
          poster_url = @posterUrl,
          trailer_url = @trailerUrl,
          trang_thai = @trangThai,
          cap_nhat_luc = @capNhatLuc
        WHERE phim_id = @phimId
      `,
    {
      phimId,
      tenPhim,
      theLoai: request.theLoai || null,
      daoDien: request.daoDien || null,
      dienVien: request.dienVien || null,
      thoiLuongPhut,
      gioiHanTuoi: request.gioiHanTuoi || null,
      ngayKhoiChieu,
      ngonNgu: request.ngonNgu || null,
      quocGia: request.quocGia || null,
      moTa: request.moTa || null,
      posterUrl: request.posterUrl || null,
      trailerUrl: request.trailerUrl || null,
      trangThai,
      capNhatLuc: now
    }
  );

  const row = await getPhimByIdInternal(phimId);
  return apiOk(res, row, "Cap nhat thanh cong");
}

async function deletePhim(req, res) {
  const phimId = Number(req.params.phimId);
  if (!phimId) return apiFail(res, 400, "Phim id khong hop le.");

  const exists = await queryOne("SELECT TOP 1 phim_id AS phimId FROM phim WHERE phim_id = @phimId", { phimId });
  if (!exists) return apiFail(res, 404, "Khong tim thay phim.");

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    await exec(
      `DELETE FROM ve WHERE suat_chieu_id IN (SELECT suat_chieu_id FROM suat_chieu WHERE phim_id = @phimId)`,
      { phimId },
      transaction
    );
    await exec(`DELETE FROM suat_chieu WHERE phim_id = @phimId`, { phimId }, transaction);
    await exec(`DELETE FROM gioi_thieu_phim WHERE phim_id = @phimId`, { phimId }, transaction);
    await exec(`DELETE FROM trailer_phim WHERE phim_id = @phimId`, { phimId }, transaction);
    await exec(`DELETE FROM phim_hot WHERE phim_id = @phimId`, { phimId }, transaction);
    await exec(`DELETE FROM gia_ve_phim WHERE phim_id = @phimId`, { phimId }, transaction);
    await exec(`DELETE FROM gia_ve_theo_loai_ghe WHERE phim_id = @phimId`, { phimId }, transaction);
    await exec(`DELETE FROM gia_ve_theo_khung_gio WHERE phim_id = @phimId`, { phimId }, transaction);
    await exec(`UPDATE ma_giam_gia SET phim_id = NULL WHERE phim_id = @phimId`, { phimId }, transaction);
    await exec(`DELETE FROM phim WHERE phim_id = @phimId`, { phimId }, transaction);
    await transaction.commit();
  } catch (e) {
    try {
      await transaction.rollback();
    } catch {
      /* ignore */
    }
    throw e;
  }

  return apiOk(res, { phimId }, "Da xoa phim");
}

async function createTrailerPhim(req, res) {
  const phimId = Number(req.params.phimId);
  const request = req.body || {};
  const now = utcNowIso();

  if (!request.trailerUrl || !String(request.trailerUrl).trim()) {
    return apiFail(res, 400, "Can nhap TrailerUrl.");
  }

  const insertRes = await queryOne(
    `
        INSERT INTO trailer_phim (
          phim_id,
          tieu_de,
          trailer_url,
          thu_tu_hien_thi,
          tao_luc
        )
        OUTPUT INSERTED.trailer_phim_id AS trailerPhimId
        VALUES (
          @phimId,
          @tieuDe,
          @trailerUrl,
          @thuTuHienThi,
          @taoLuc
        )
      `,
    {
      phimId,
      tieuDe: request.tieuDe || null,
      trailerUrl: String(request.trailerUrl).trim(),
      thuTuHienThi: Number(request.thuTuHienThi ?? 1),
      taoLuc: now
    }
  );

  const trailerPhimId = Number(insertRes?.trailerPhimId);
  const row = await queryOne(
    `
        SELECT
          trailer_phim_id AS trailerPhimId,
          phim_id AS phimId,
          tieu_de AS tieuDe,
          trailer_url AS trailerUrl,
          thu_tu_hien_thi AS thuTuHienThi,
          tao_luc AS taoLuc
        FROM trailer_phim
        WHERE trailer_phim_id = @trailerPhimId
      `,
    { trailerPhimId }
  );

  return apiOk(res, row);
}

async function deleteTrailerPhim(req, res) {
  const id = Number(req.params.id);
  if (!id) return apiFail(res, 400, "ID khong hop le.");
  await exec(`DELETE FROM trailer_phim WHERE trailer_phim_id = @id`, { id });
  return apiOk(res, { message: "Da xoa trailer." });
}

async function createGioiThieu(req, res) {
  const phimId = Number(req.params.phimId);
  const noiDung = (req.body.noiDung || "").trim();
  if (!noiDung) return apiFail(res, 400, "Noi dung khong duoc de trong.");
  
  const insertRes = await queryOne(
    `INSERT INTO gioi_thieu_phim (phim_id, noi_dung) OUTPUT INSERTED.gioi_thieu_phim_id AS id VALUES (@phimId, @noiDung)`,
    { phimId, noiDung }
  );
  return apiOk(res, { gioiThieuPhimId: insertRes.id });
}

async function updateGioiThieu(req, res) {
  const id = Number(req.params.id);
  const noiDung = (req.body.noiDung || "").trim();
  if (!noiDung) return apiFail(res, 400, "Noi dung khong duoc de trong.");

  await exec(`UPDATE gioi_thieu_phim SET noi_dung = @noiDung, cap_nhat_luc = SYSUTCDATETIME() WHERE gioi_thieu_phim_id = @id`, { noiDung, id });
  return apiOk(res, { message: "Cap nhat thanh cong." });
}

async function deleteGioiThieu(req, res) {
  const id = Number(req.params.id);
  await exec(`DELETE FROM gioi_thieu_phim WHERE gioi_thieu_phim_id = @id`, { id });
  return apiOk(res, { message: "Da xoa gioi thieu." });
}

async function createPhimHot(req, res) {
  const body = req.body || {};
  const phimId = Number(body.phimId);
  const thuTuHienThi = Number(body.thuTuHienThi) || 1;
  const tuNgay = body.tuNgay ? body.tuNgay.trim() : null;
  const denNgay = body.denNgay ? body.denNgay.trim() : null;

  if (!phimId || !tuNgay) return apiFail(res, 400, "Thieu thong tin phim hoac tuNgay.");

  const insertRes = await queryOne(
    `INSERT INTO phim_hot (phim_id, thu_tu_hien_thi, tu_ngay, den_ngay) OUTPUT INSERTED.phim_hot_id AS id VALUES (@phimId, @thuTuHienThi, @tuNgay, @denNgay)`,
    { phimId, thuTuHienThi, tuNgay, denNgay }
  );
  return apiOk(res, { phimHotId: insertRes.id });
}

async function deletePhimHot(req, res) {
  const id = Number(req.params.id);
  await exec(`DELETE FROM phim_hot WHERE phim_hot_id = @id`, { id });
  return apiOk(res, { message: "Da xoa khoi danh sach phim hot." });
}

module.exports = {
  listPhim,
  listPhimHot,
  getPhimById,
  listGioiThieu,
  listTrailer,
  createPhim,
  updatePhim,
  deletePhim,
  createTrailerPhim,
  deleteTrailerPhim,
  createGioiThieu,
  updateGioiThieu,
  deleteGioiThieu,
  createPhimHot,
  deletePhimHot
};
