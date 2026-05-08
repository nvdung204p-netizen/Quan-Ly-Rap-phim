const { queryOne } = require("../db/queries");

async function tinhGiaVe({ phimId, phongChieuId, thoiGianBatDau }, { loaiGheId }, tx = null) {
  const ngayChieu = thoiGianBatDau.toISOString().slice(0, 10);
  const gioChieu = (() => {
    const d = thoiGianBatDau;
    const HH = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
    return `${HH}:${mm}:${ss}`;
  })();

  const giaLoaiGhe = await queryOne(
    `
      SELECT TOP 1 CAST(gvl.gia_ve AS decimal(18, 2)) AS giaVe
      FROM gia_ve_theo_loai_ghe gvl
      WHERE gvl.phim_id = @phimId
        AND gvl.phong_chieu_id = @phongChieuId
        AND gvl.loai_ghe_id = @loaiGheId
        AND gvl.tu_ngay <= @ngayChieu
        AND (gvl.den_ngay IS NULL OR gvl.den_ngay >= @ngayChieu)
      ORDER BY gvl.tu_ngay DESC
    `,
    { phimId, phongChieuId, loaiGheId, ngayChieu },
    tx
  );
  if (giaLoaiGhe?.giaVe != null) return Number(giaLoaiGhe.giaVe);

  const khungGio = await queryOne(
    `
      SELECT TOP 1 kh.khung_gio_id AS khungGioId
      FROM khung_gio kh
      WHERE kh.gio_bat_dau <= @gioChieu AND kh.gio_ket_thuc > @gioChieu
    `,
    { gioChieu },
    tx
  );

  if (khungGio?.khungGioId) {
    const giaKhungGio = await queryOne(
      `
        SELECT TOP 1 CAST(gkg.gia_ve AS decimal(18, 2)) AS giaVe
        FROM gia_ve_theo_khung_gio gkg
        WHERE gkg.phim_id = @phimId
          AND gkg.khung_gio_id = @khungGioId
          AND gkg.tu_ngay <= @ngayChieu
          AND (gkg.den_ngay IS NULL OR gkg.den_ngay >= @ngayChieu)
        ORDER BY gkg.tu_ngay DESC
      `,
      { phimId, khungGioId: khungGio.khungGioId, ngayChieu },
      tx
    );
    if (giaKhungGio?.giaVe != null) return Number(giaKhungGio.giaVe);
  }

  const giaPhim = await queryOne(
    `
      SELECT TOP 1 CAST(gvp.gia_co_ban AS decimal(18, 2)) AS giaVe
      FROM gia_ve_phim gvp
      WHERE gvp.phim_id = @phimId
        AND gvp.tu_ngay <= @ngayChieu
        AND (gvp.den_ngay IS NULL OR gvp.den_ngay >= @ngayChieu)
      ORDER BY gvp.tu_ngay DESC
    `,
    { phimId, ngayChieu },
    tx
  );

  return giaPhim?.giaVe != null ? Number(giaPhim.giaVe) : 0;
}

module.exports = { tinhGiaVe };
