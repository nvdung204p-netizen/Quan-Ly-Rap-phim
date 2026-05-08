const { queryOne, queryAll, exec } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");

async function listSuatChieu(req, res) {
  const tuNgay = req.query.tuNgay ? new Date(req.query.tuNgay) : null;
  const denNgay = req.query.denNgay ? new Date(req.query.denNgay) : null;
  const phimId = req.query.phimId ? Number(req.query.phimId) : null;
  const ngay = req.query.ngay ? String(req.query.ngay).trim() : null; // YYYY-MM-DD

  let whereSql = "";
  const params = {};

  if (ngay) {
    // Lọc theo ngày cụ thể (giờ địa phương — client gửi YYYY-MM-DD)
    whereSql += ` AND CAST(sc.thoi_gian_bat_dau AS DATE) = @ngay`;
    params.ngay = ngay;
  } else {
    if (tuNgay) {
      whereSql += " AND sc.thoi_gian_bat_dau >= @tuNgay";
      params.tuNgay = tuNgay;
    }
    if (denNgay) {
      whereSql += " AND sc.thoi_gian_bat_dau <= @denNgay";
      params.denNgay = denNgay;
    }
  }
  if (phimId) {
    whereSql += " AND sc.phim_id = @phimId";
    params.phimId = phimId;
  }

  const rows = await queryAll(
    `
      SELECT
        sc.suat_chieu_id      AS suatChieuId,
        sc.phim_id            AS phimId,
        p.ten_phim            AS tenPhim,
        p.poster_url          AS posterUrl,
        p.thoi_luong_phut     AS thoiLuongPhut,
        p.gioi_han_tuoi       AS gioiHanTuoi,
        sc.phong_chieu_id     AS phongChieuId,
        pc.ten_phong          AS tenPhong,
        pc.loai_phong         AS loaiPhong,
        pc.suc_chua           AS sucChua,
        sc.thoi_gian_bat_dau  AS thoiGianBatDau,
        sc.thoi_gian_ket_thuc AS thoiGianKetThuc,
        sc.trang_thai         AS trangThai,
        (
          SELECT COUNT_BIG(1)
          FROM ve v
          WHERE v.suat_chieu_id = sc.suat_chieu_id
            AND v.trang_thai <> 'HUY'
        ) AS soDaDat,
        pc.suc_chua - (
          SELECT COUNT_BIG(1)
          FROM ve v
          WHERE v.suat_chieu_id = sc.suat_chieu_id
            AND v.trang_thai <> 'HUY'
        ) AS soGheTrong
      FROM suat_chieu sc
      JOIN phim p ON p.phim_id = sc.phim_id
      JOIN phong_chieu pc ON pc.phong_chieu_id = sc.phong_chieu_id
      WHERE 1=1
      ${whereSql}
      ORDER BY sc.thoi_gian_bat_dau ASC
    `,
    params
  );
  return apiOk(res, rows);
}

async function createSuatChieu(req, res) {
  const request = req.body || {};
  const phimId = Number(request.phimId);
  const phongChieuId = Number(request.phongChieuId);
  let thoiGianBatDau = request.thoiGianBatDau ? new Date(request.thoiGianBatDau) : null;
  let thoiGianKetThuc = request.thoiGianKetThuc ? new Date(request.thoiGianKetThuc) : null;

  if (!phimId || !phongChieuId) return apiFail(res, 400, "Can chon phim va phong chieu.");
  if (!thoiGianBatDau) return apiFail(res, 400, "Can nhap thoi gian bat dau.");

  const phim = await queryOne("SELECT TOP 1 phim_id AS phimId, thoi_luong_phut AS thoiLuongPhut FROM phim WHERE phim_id = @phimId", { phimId });
  if (!phim) return apiFail(res, 400, "Phim khong ton tai.");

  const phong = await queryOne("SELECT TOP 1 phong_chieu_id AS phongChieuId FROM phong_chieu WHERE phong_chieu_id = @phongChieuId AND trang_thai = 'HOAT_DONG'", { phongChieuId });
  if (!phong) return apiFail(res, 400, "Phong chieu khong ton tai hoac dang bao tri.");

  // Tự tính giờ kết thúc nếu chưa có
  if (!thoiGianKetThuc && phim.thoiLuongPhut) {
    thoiGianKetThuc = new Date(thoiGianBatDau.getTime() + phim.thoiLuongPhut * 60 * 1000 + 15 * 60 * 1000); // +15 phút dọn dẹp
  }
  if (!thoiGianKetThuc) return apiFail(res, 400, "Can nhap thoi gian ket thuc hoac nhap phim co thoi luong.");
  if (thoiGianKetThuc <= thoiGianBatDau) return apiFail(res, 400, "Thoi gian ket thuc phai lon hon thoi gian bat dau.");

  // Kiểm tra trùng lịch (loại trừ suất bị HUY)
  const biTrungLich = await queryOne(
    `
      SELECT TOP 1 sc.suat_chieu_id AS id, p.ten_phim AS tenPhim,
        CONVERT(NVARCHAR(20), sc.thoi_gian_bat_dau, 108) AS batDau,
        CONVERT(NVARCHAR(20), sc.thoi_gian_ket_thuc, 108) AS ketThuc
      FROM suat_chieu sc
      JOIN phim p ON p.phim_id = sc.phim_id
      WHERE sc.phong_chieu_id = @phongChieuId
        AND sc.trang_thai <> 'HUY'
        AND @start < sc.thoi_gian_ket_thuc
        AND @end > sc.thoi_gian_bat_dau
    `,
    { phongChieuId, start: thoiGianBatDau, end: thoiGianKetThuc }
  );
  if (biTrungLich) {
    return apiFail(res, 409, `Phong da co suat "${biTrungLich.tenPhim}" tu ${biTrungLich.batDau} den ${biTrungLich.ketThuc} trung voi khung gio nay.`);
  }

  const trangThai = request.trangThai && String(request.trangThai).trim() ? String(request.trangThai).trim() : "DANG_MO_BAN";

  const insertRes = await queryOne(
    `
      INSERT INTO suat_chieu (phim_id, phong_chieu_id, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)
      OUTPUT INSERTED.suat_chieu_id AS suatChieuId
      VALUES (@phimId, @phongChieuId, @thoiGianBatDau, @thoiGianKetThuc, @trangThai)
    `,
    { phimId, phongChieuId, thoiGianBatDau, thoiGianKetThuc, trangThai }
  );

  const suatChieuId = Number(insertRes?.suatChieuId);
  const row = await queryOne(
    `
      SELECT
        sc.suat_chieu_id AS suatChieuId,
        sc.phim_id AS phimId,
        p.ten_phim AS tenPhim,
        sc.phong_chieu_id AS phongChieuId,
        pc.ten_phong AS tenPhong,
        sc.thoi_gian_bat_dau AS thoiGianBatDau,
        sc.thoi_gian_ket_thuc AS thoiGianKetThuc,
        sc.trang_thai AS trangThai,
        pc.suc_chua AS soGheTrong
      FROM suat_chieu sc
      JOIN phim p ON p.phim_id = sc.phim_id
      JOIN phong_chieu pc ON pc.phong_chieu_id = sc.phong_chieu_id
      WHERE sc.suat_chieu_id = @suatChieuId
    `,
    { suatChieuId }
  );

  return apiOk(res, row, "Tao suat chieu thanh cong.", 201);
}

async function updateSuatChieu(req, res) {
  const suatChieuId = Number(req.params.suatChieuId);
  if (!Number.isFinite(suatChieuId) || suatChieuId <= 0) return apiFail(res, 400, "Ma suat chieu khong hop le.");

  const existing = await queryOne(
    "SELECT TOP 1 suat_chieu_id AS suatChieuId FROM suat_chieu WHERE suat_chieu_id = @suatChieuId",
    { suatChieuId }
  );
  if (!existing) return apiFail(res, 404, "Khong tim thay suat chieu.");

  // Kiểm tra đã có vé chưa (nếu có, chỉ được đổi trạng thái)
  const daCoVe = await queryOne(
    "SELECT COUNT_BIG(1) AS n FROM ve WHERE suat_chieu_id = @suatChieuId AND trang_thai <> 'HUY'",
    { suatChieuId }
  );
  if (Number(daCoVe?.n) > 0 && req.body?.chinhSuaThoiGian) {
    return apiFail(res, 409, "Khong the chinh sua thoi gian suat da co ve dat.");
  }

  const request = req.body || {};
  const phimId = Number(request.phimId);
  const phongChieuId = Number(request.phongChieuId);
  const thoiGianBatDau = request.thoiGianBatDau ? new Date(request.thoiGianBatDau) : null;
  const thoiGianKetThuc = request.thoiGianKetThuc ? new Date(request.thoiGianKetThuc) : null;

  if (!thoiGianBatDau || !thoiGianKetThuc) return apiFail(res, 400, "Can nhap thoi gian.");
  if (thoiGianKetThuc <= thoiGianBatDau) return apiFail(res, 400, "Thoi gian ket thuc phai lon hon thoi gian bat dau.");

  const phimTonTai = await queryOne("SELECT TOP 1 1 AS x FROM phim WHERE phim_id = @phimId", { phimId });
  const phongTonTai = await queryOne("SELECT TOP 1 1 AS x FROM phong_chieu WHERE phong_chieu_id = @phongChieuId", { phongChieuId });
  if (!phimTonTai || !phongTonTai) return apiFail(res, 400, "Phim hoac phong chieu khong ton tai.");

  const biTrungLich = await queryOne(
    `
      SELECT TOP 1 1 AS x
      FROM suat_chieu
      WHERE phong_chieu_id = @phongChieuId
        AND suat_chieu_id <> @suatChieuId
        AND trang_thai <> 'HUY'
        AND @start < thoi_gian_ket_thuc
        AND @end > thoi_gian_bat_dau
    `,
    { phongChieuId, suatChieuId, start: thoiGianBatDau, end: thoiGianKetThuc }
  );
  if (biTrungLich) return apiFail(res, 409, "Phong chieu da co suat trung khung thoi gian.");

  const trangThai = request.trangThai && String(request.trangThai).trim() ? String(request.trangThai).trim() : "DANG_MO_BAN";

  await exec(
    `
      UPDATE suat_chieu
      SET phim_id = @phimId, phong_chieu_id = @phongChieuId,
          thoi_gian_bat_dau = @thoiGianBatDau, thoi_gian_ket_thuc = @thoiGianKetThuc,
          trang_thai = @trangThai
      WHERE suat_chieu_id = @suatChieuId
    `,
    { suatChieuId, phimId, phongChieuId, thoiGianBatDau, thoiGianKetThuc, trangThai }
  );

  const row = await queryOne(
    `
      SELECT sc.suat_chieu_id AS suatChieuId, sc.phim_id AS phimId,
        p.ten_phim AS tenPhim, sc.phong_chieu_id AS phongChieuId,
        pc.ten_phong AS tenPhong, sc.thoi_gian_bat_dau AS thoiGianBatDau,
        sc.thoi_gian_ket_thuc AS thoiGianKetThuc, sc.trang_thai AS trangThai
      FROM suat_chieu sc
      JOIN phim p ON p.phim_id = sc.phim_id
      JOIN phong_chieu pc ON pc.phong_chieu_id = sc.phong_chieu_id
      WHERE sc.suat_chieu_id = @suatChieuId
    `,
    { suatChieuId }
  );

  return apiOk(res, row);
}

async function deleteSuatChieu(req, res) {
  const suatChieuId = Number(req.params.suatChieuId);
  if (!Number.isFinite(suatChieuId) || suatChieuId <= 0) return apiFail(res, 400, "Ma suat chieu khong hop le.");

  const existing = await queryOne(
    "SELECT TOP 1 suat_chieu_id AS suatChieuId FROM suat_chieu WHERE suat_chieu_id = @suatChieuId",
    { suatChieuId }
  );
  if (!existing) return apiFail(res, 404, "Khong tim thay suat chieu.");

  const veRow = await queryOne(
    "SELECT COUNT_BIG(1) AS n FROM ve WHERE suat_chieu_id = @suatChieuId AND trang_thai <> 'HUY'",
    { suatChieuId }
  );
  const n = Number(veRow?.n ?? 0);
  if (n > 0) return apiFail(res, 409, `Khong the xoa suat: da co ${n} ve dat cho suat nay. Hay doi trang thai sang HUY.`);

  await exec("DELETE FROM suat_chieu WHERE suat_chieu_id = @suatChieuId", { suatChieuId });
  return apiOk(res, { suatChieuId }, "Da xoa suat chieu.");
}

module.exports = { listSuatChieu, createSuatChieu, updateSuatChieu, deleteSuatChieu };
