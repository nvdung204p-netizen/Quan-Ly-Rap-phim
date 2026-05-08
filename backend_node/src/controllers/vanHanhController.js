const { queryOne, queryAll, exec } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");
const { utcNowIso } = require("../utils/helpers");

async function checkinQr(req, res) {
  const request = req.body || {};
  const maQrVe = request.maQrVe ? String(request.maQrVe).trim() : "";
  if (!maQrVe) return apiFail(res, 400, "Can nhap ma qr ve.");

  const ve = await queryOne(
    `
      SELECT TOP 1 
        v.ve_id AS veId, v.trang_thai AS trangThai, v.da_checkin AS daCheckin,
        g.ma_ghe AS maGhe,
        p.ten_phim AS tenPhim,
        sc.thoi_gian_bat_dau AS thoiGianBatDau,
        tk.ho_ten AS hoTenKhach
      FROM ve v
      JOIN ghe g ON v.ghe_id = g.ghe_id
      JOIN suat_chieu sc ON v.suat_chieu_id = sc.suat_chieu_id
      JOIN phim p ON sc.phim_id = p.phim_id
      JOIN don_dat_ve d ON v.don_dat_ve_id = d.don_dat_ve_id
      LEFT JOIN tai_khoan tk ON d.tai_khoan_id = tk.tai_khoan_id
      WHERE v.ma_qr_ve = @maQrVe OR v.ve_id = TRY_CAST(@maQrVe AS BIGINT)
    `,
    { maQrVe }
  );
  if (!ve) return apiFail(res, 404, "Khong tim thay ve.");
  if (ve.trangThai !== "HOP_LE") return apiFail(res, 400, "Ve khong hop le hoac da bi huy.");
  if (Boolean(ve.daCheckin)) return apiFail(res, 400, "Ve da checkin truoc do.");

  const now = utcNowIso();
  const checkinBoi = req.user?.taiKhoanId ? Number(req.user.taiKhoanId) : null;
  
  await exec("UPDATE ve SET da_checkin = 1, checkin_luc = @now, checkin_boi = @checkinBoi WHERE ve_id = @veId", { now, checkinBoi, veId: ve.veId });

  return apiOk(res, {
    message: "Checkin thanh cong",
    veId: ve.veId,
    checkinLuc: now,
    chiTiet: {
      maGhe: ve.maGhe,
      tenPhim: ve.tenPhim,
      thoiGianBatDau: ve.thoiGianBatDau,
      hoTenKhach: ve.hoTenKhach || "Khách vãng lai"
    }
  });
}

async function searchDonDatVe(req, res) {
  const keyword = (req.query.q || "").trim();
  if (!keyword) {
    const uid = req.user?.taiKhoanId;
    if (!uid) return apiOk(res, []);
    const rows = await queryAll(`
      SELECT
        d.don_dat_ve_id AS donDatVeId,
        d.ma_don AS maDon,
        d.tong_thanh_toan AS tongThanhToan,
        d.trang_thai AS trangThai,
        d.kenh_dat AS kenhDat,
        d.tao_luc AS taoLuc,
        tk.ho_ten AS hoTen,
        tk.so_dien_thoai AS soDienThoai
      FROM don_dat_ve d
      LEFT JOIN tai_khoan tk ON d.tai_khoan_id = tk.tai_khoan_id
      WHERE d.tai_khoan_id = @uid AND d.kenh_dat = 'QUAY'
      ORDER BY d.tao_luc DESC
    `, { uid });
    return apiOk(res, rows);
  }

  const rows = await queryAll(`
    SELECT
      d.don_dat_ve_id AS donDatVeId,
      d.ma_don AS maDon,
      d.tong_thanh_toan AS tongThanhToan,
      d.trang_thai AS trangThai,
      d.kenh_dat AS kenhDat,
      d.tao_luc AS taoLuc,
      tk.ho_ten AS hoTen,
      tk.so_dien_thoai AS soDienThoai
    FROM don_dat_ve d
    LEFT JOIN tai_khoan tk ON d.tai_khoan_id = tk.tai_khoan_id
    WHERE d.ma_don LIKE '%' + @keyword + '%' OR tk.so_dien_thoai LIKE '%' + @keyword + '%'
    ORDER BY d.tao_luc DESC
  `, { keyword });

  return apiOk(res, rows);
}

async function lichSuCheckin(req, res) {
  const rows = await queryAll(`
    SELECT TOP 50
      v.ve_id AS veId,
      v.checkin_luc AS checkinLuc,
      g.ma_ghe AS maGhe,
      p.ten_phim AS tenPhim,
      sc.thoi_gian_bat_dau AS thoiGianBatDau,
      tk.ho_ten AS hoTenNhanVien
    FROM ve v
    JOIN ghe g ON v.ghe_id = g.ghe_id
    JOIN suat_chieu sc ON v.suat_chieu_id = sc.suat_chieu_id
    JOIN phim p ON sc.phim_id = p.phim_id
    LEFT JOIN tai_khoan tk ON v.checkin_boi = tk.tai_khoan_id
    WHERE v.da_checkin = 1
    ORDER BY v.checkin_luc DESC
  `);
  return apiOk(res, rows);
}

module.exports = { checkinQr, searchDonDatVe, lichSuCheckin };
