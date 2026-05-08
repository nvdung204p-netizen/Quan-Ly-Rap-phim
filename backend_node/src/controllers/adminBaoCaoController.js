const { queryOne, queryAll } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");

/**
 * GET /api/Admin/bao-cao/tong-quan
 * KPI: doanh thu 30 ngày, số vé bán, số đơn, tỷ lệ check-in
 */
async function tongQuan(_req, res) {
  const [kpi, doanhThuThang, veThang] = await Promise.all([
    queryOne(`
      SELECT
        SUM(CASE WHEN DATEDIFF(DAY, d.tao_luc, SYSUTCDATETIME()) <= 30 AND d.trang_thai = 'DA_THANH_TOAN' THEN d.tong_thanh_toan ELSE 0 END) AS doanhThu30Ngay,
        SUM(CASE WHEN DATEDIFF(DAY, d.tao_luc, SYSUTCDATETIME()) <= 30 THEN 1 ELSE 0 END) AS soDon30Ngay,
        SUM(CASE WHEN d.trang_thai = 'DA_THANH_TOAN' THEN 1 ELSE 0 END) AS tongDonThanhToan,
        SUM(CASE WHEN d.trang_thai = 'CHO_THANH_TOAN' THEN 1 ELSE 0 END) AS dongDonCho,
        (SELECT COUNT_BIG(1) FROM ve WHERE trang_thai = 'DA_SU_DUNG') AS soVeCheckin,
        (SELECT COUNT_BIG(1) FROM ve WHERE trang_thai <> 'HUY') AS tongVe
      FROM don_dat_ve d
    `),
    queryOne(`
      SELECT ISNULL(SUM(t.so_tien), 0) AS doanhThuThang
      FROM thanh_toan t
      WHERE t.trang_thai = 'THANH_CONG'
        AND YEAR(t.thanh_toan_luc) = YEAR(SYSUTCDATETIME())
        AND MONTH(t.thanh_toan_luc) = MONTH(SYSUTCDATETIME())
    `),
    queryOne(`
      SELECT COUNT_BIG(1) AS soVeThang
      FROM ve v
      JOIN don_dat_ve d ON d.don_dat_ve_id = v.don_dat_ve_id
      WHERE v.trang_thai <> 'HUY'
        AND YEAR(d.tao_luc) = YEAR(SYSUTCDATETIME())
        AND MONTH(d.tao_luc) = MONTH(SYSUTCDATETIME())
    `)
  ]);

  const tongVe = Number(kpi?.tongVe || 0);
  const soVeCheckin = Number(kpi?.soVeCheckin || 0);

  return apiOk(res, {
    doanhThu30Ngay: Number(kpi?.doanhThu30Ngay || 0),
    doanhThuThang: Number(doanhThuThang?.doanhThuThang || 0),
    soDon30Ngay: Number(kpi?.soDon30Ngay || 0),
    tongDonThanhToan: Number(kpi?.tongDonThanhToan || 0),
    tongDonCho: Number(kpi?.dongDonCho || 0),
    soVeThang: Number(veThang?.soVeThang || 0),
    tongVe,
    soVeCheckin,
    tyLeCheckin: tongVe > 0 ? Math.round((soVeCheckin / tongVe) * 100) : 0
  });
}

/**
 * GET /api/Admin/bao-cao/doanh-thu-theo-ngay?tuNgay=&denNgay=
 * Doanh thu từng ngày trong khoảng (mặc định 30 ngày gần nhất)
 */
async function doanhThuTheoNgay(req, res) {
  const tuNgay = req.query.tuNgay || null;
  const denNgay = req.query.denNgay || null;

  const params = {};
  let whereClause = "";

  if (tuNgay) {
    params.tuNgay = tuNgay;
    whereClause += " AND CAST(t.thanh_toan_luc AS DATE) >= @tuNgay";
  } else {
    whereClause += " AND t.thanh_toan_luc >= DATEADD(DAY, -29, CAST(SYSUTCDATETIME() AS DATE))";
  }

  if (denNgay) {
    params.denNgay = denNgay;
    whereClause += " AND CAST(t.thanh_toan_luc AS DATE) <= @denNgay";
  }

  const rows = await queryAll(
    `
      SELECT
        CAST(t.thanh_toan_luc AS DATE) AS ngay,
        SUM(t.so_tien) AS doanhThu,
        COUNT_BIG(DISTINCT d.don_dat_ve_id) AS soDon,
        SUM(ve_count.soVe) AS soVe
      FROM thanh_toan t
      JOIN don_dat_ve d ON d.don_dat_ve_id = t.don_dat_ve_id
      JOIN (
        SELECT don_dat_ve_id, COUNT_BIG(1) AS soVe
        FROM ve WHERE trang_thai <> 'HUY'
        GROUP BY don_dat_ve_id
      ) ve_count ON ve_count.don_dat_ve_id = d.don_dat_ve_id
      WHERE t.trang_thai = 'THANH_CONG'
      ${whereClause}
      GROUP BY CAST(t.thanh_toan_luc AS DATE)
      ORDER BY ngay ASC
    `,
    params
  );

  return apiOk(res, rows.map(r => ({
    ngay: r.ngay,
    doanhThu: Number(r.doanhThu || 0),
    soDon: Number(r.soDon || 0),
    soVe: Number(r.soVe || 0)
  })));
}

/**
 * GET /api/Admin/bao-cao/doanh-thu-theo-phim?limit=10
 * Xếp hạng phim theo doanh thu
 */
async function doanhThuTheoPhim(req, res) {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const rows = await queryAll(
    `
      SELECT TOP (@limit)
        p.phim_id AS phimId,
        p.ten_phim AS tenPhim,
        p.poster_url AS posterUrl,
        p.trang_thai AS trangThai,
        SUM(t.so_tien) AS doanhThu,
        COUNT_BIG(DISTINCT d.don_dat_ve_id) AS soDon,
        COUNT_BIG(v.ve_id) AS soVe
      FROM thanh_toan t
      JOIN don_dat_ve d ON d.don_dat_ve_id = t.don_dat_ve_id
      JOIN ve v ON v.don_dat_ve_id = d.don_dat_ve_id
      JOIN suat_chieu sc ON sc.suat_chieu_id = v.suat_chieu_id
      JOIN phim p ON p.phim_id = sc.phim_id
      WHERE t.trang_thai = 'THANH_CONG' AND v.trang_thai <> 'HUY'
      GROUP BY p.phim_id, p.ten_phim, p.poster_url, p.trang_thai
      ORDER BY doanhThu DESC
    `,
    { limit }
  );

  return apiOk(res, rows.map(r => ({
    ...r,
    doanhThu: Number(r.doanhThu || 0),
    soDon: Number(r.soDon || 0),
    soVe: Number(r.soVe || 0)
  })));
}

/**
 * GET /api/Admin/bao-cao/don-hang-gan-day?limit=20
 * 20 đơn hàng gần nhất
 */
async function donHangGanDay(req, res) {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const rows = await queryAll(
    `
      SELECT TOP (@limit)
        d.don_dat_ve_id AS donDatVeId,
        d.ma_don AS maDon,
        tk.ho_ten AS tenKhach,
        tk.so_dien_thoai AS soDienThoai,
        d.tong_thanh_toan AS tongThanhToan,
        d.trang_thai AS trangThai,
        d.kenh_dat AS kenhDat,
        d.tao_luc AS taoLuc,
        (SELECT COUNT_BIG(1) FROM ve v WHERE v.don_dat_ve_id = d.don_dat_ve_id AND v.trang_thai <> 'HUY') AS soVe
      FROM don_dat_ve d
      LEFT JOIN tai_khoan tk ON tk.tai_khoan_id = d.tai_khoan_id
      ORDER BY d.tao_luc DESC
    `,
    { limit }
  );

  return apiOk(res, rows.map(r => ({
    ...r,
    tongThanhToan: Number(r.tongThanhToan || 0),
    soVe: Number(r.soVe || 0)
  })));
}

/**
 * GET /api/Admin/bao-cao/phong-chieu
 * Thống kê công suất phòng chiếu
 */
async function thongKePhongChieu(_req, res) {
  const rows = await queryAll(`
    SELECT
      pc.phong_chieu_id AS phongChieuId,
      pc.ma_phong AS maPhong,
      pc.ten_phong AS tenPhong,
      pc.loai_phong AS loaiPhong,
      pc.suc_chua AS sucChua,
      (SELECT COUNT_BIG(1) FROM suat_chieu sc WHERE sc.phong_chieu_id = pc.phong_chieu_id) AS tongSuat,
      (SELECT COUNT_BIG(1) FROM suat_chieu sc WHERE sc.phong_chieu_id = pc.phong_chieu_id
        AND CAST(sc.thoi_gian_bat_dau AS DATE) = CAST(SYSUTCDATETIME() AS DATE)) AS suatHomNay,
      (SELECT ISNULL(SUM(t.so_tien), 0)
        FROM thanh_toan t
        JOIN don_dat_ve d ON d.don_dat_ve_id = t.don_dat_ve_id
        JOIN ve v ON v.don_dat_ve_id = d.don_dat_ve_id
        JOIN suat_chieu sc2 ON sc2.suat_chieu_id = v.suat_chieu_id
        WHERE sc2.phong_chieu_id = pc.phong_chieu_id
          AND t.trang_thai = 'THANH_CONG'
          AND YEAR(t.thanh_toan_luc) = YEAR(SYSUTCDATETIME())
          AND MONTH(t.thanh_toan_luc) = MONTH(SYSUTCDATETIME())
      ) AS doanhThuThang
    FROM phong_chieu pc
    WHERE pc.trang_thai = 'HOAT_DONG'
    ORDER BY pc.ma_phong
  `);

  return apiOk(res, rows.map(r => ({
    ...r,
    doanhThuThang: Number(r.doanhThuThang || 0)
  })));
}

module.exports = { tongQuan, doanhThuTheoNgay, doanhThuTheoPhim, donHangGanDay, thongKePhongChieu };
