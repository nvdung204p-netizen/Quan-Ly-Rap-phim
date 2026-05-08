const crypto = require("crypto");
const { getPool, sql } = require("../db/pool");
const { queryOne, queryAll, exec } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");
const { utcNowIso, makeInClauseParams, formatMaDonLikeCSharp, formatGiaoDichLikeCSharp } = require("../utils/helpers");
const { tinhGiaVe } = require("../services/datVePricing");

async function soDoGhe(req, res) {
  const suatChieuId = Number(req.params.suatChieuId);
  const suatChieu = await queryOne(
    `
        SELECT TOP 1 suat_chieu_id AS suatChieuId, phong_chieu_id AS phongChieuId
        FROM suat_chieu
        WHERE suat_chieu_id = @suatChieuId
      `,
    { suatChieuId }
  );
  if (!suatChieu) return apiFail(res, 404, "Khong tim thay suat chieu.");

  const dsGhe = await queryAll(
    `
        SELECT
          g.ghe_id AS gheId,
          g.ma_ghe AS maGhe,
          g.hang_ghe AS hangGhe,
          g.cot_ghe AS cotGhe,
          lg.ma_loai AS loaiGhe,
          CAST(
            CASE WHEN EXISTS (
              SELECT 1
              FROM ve v
              WHERE v.suat_chieu_id = @suatChieuId
                AND v.trang_thai <> 'HUY'
                AND v.ghe_id = g.ghe_id
            ) THEN 1 ELSE 0 END
          AS BIT) AS daDat
        FROM ghe g
        JOIN loai_ghe lg ON lg.loai_ghe_id = g.loai_ghe_id
        WHERE g.phong_chieu_id = @phongChieuId
        ORDER BY g.hang_ghe, g.cot_ghe
      `,
    { suatChieuId, phongChieuId: suatChieu.phongChieuId }
  );

  const normalized = dsGhe.map((x) => ({
    gheId: x.gheId,
    maGhe: x.maGhe,
    hangGhe: x.hangGhe,
    cotGhe: x.cotGhe,
    loaiGhe: x.loaiGhe,
    daDat: Boolean(x.daDat)
  }));
  return apiOk(res, normalized);
}

async function listLoaiVe(_req, res) {
  const rows = await queryAll(
    `
        SELECT loai_ve_id AS loaiVeId, ma_loai AS maLoai, ten_loai AS tenLoai, mo_ta AS moTa
        FROM loai_ve
        ORDER BY loai_ve_id
      `
  );
  return apiOk(res, rows);
}

async function listPhuongThucThanhToan(_req, res) {
  const rows = await queryAll(
    `
        SELECT
          phuong_thuc_thanh_toan_id AS phuongThucThanhToanId,
          ma_phuong_thuc AS maPhuongThuc,
          ten_phuong_thuc AS tenPhuongThuc
        FROM phuong_thuc_thanh_toan
        ORDER BY phuong_thuc_thanh_toan_id
      `
  );
  return apiOk(res, rows);
}

async function taoDon(req, res) {
  const request = req.body || {};
  const suatChieuId = Number(request.suatChieuId);
  const danhSachGheId = Array.isArray(request.danhSachGheId) ? request.danhSachGheId.map((x) => Number(x)) : [];
  const loaiVeId = Number(request.loaiVeId);
  const maCodeGiamGia = request.maCodeGiamGia ? String(request.maCodeGiamGia).trim() : "";
  const kenhDat = request.kenhDat === "QUAY" ? "QUAY" : "ONLINE";
  
  // Xác định người mua (người sở hữu đơn)
  let taiKhoanId = null;
  const isStaff = req.user?.vaiTro?.includes("ADMIN") || req.user?.vaiTro?.includes("NHAN_VIEN");

  if (kenhDat === "QUAY" && isStaff) {
    // Nếu bán tại quầy, taiKhoanId có thể là khachHangId (nếu khách cung cấp) hoặc NULL (khách vãng lai)
    taiKhoanId = request.khachHangId ? Number(request.khachHangId) : null;
  } else {
    // Nếu đặt online, taiKhoanId phải là user đang đăng nhập
    taiKhoanId = req.user?.taiKhoanId != null ? Number(req.user.taiKhoanId) : null;
    if (!taiKhoanId) return apiFail(res, 401, "Can dang nhap de tao don dat ve.");
  }

  if (!danhSachGheId || danhSachGheId.length === 0) {
    return apiFail(res, 400, "Can chon it nhat 1 ghe.");
  }

  const suatChieu = await queryOne(
    `
        SELECT TOP 1 suat_chieu_id AS suatChieuId, phim_id AS phimId, phong_chieu_id AS phongChieuId, thoi_gian_bat_dau AS thoiGianBatDau
        FROM suat_chieu
        WHERE suat_chieu_id = @suatChieuId
      `,
    { suatChieuId }
  );
  if (!suatChieu) return apiFail(res, 404, "Khong tim thay suat chieu.");

  const phim = await queryOne("SELECT TOP 1 phim_id AS phimId FROM phim WHERE phim_id = @phimId", {
    phimId: suatChieu.phimId
  });
  if (!phim) return apiFail(res, 400, "Suat chieu chua gan phim hop le.");

  const loaiVe = await queryOne("SELECT TOP 1 loai_ve_id AS loaiVeId FROM loai_ve WHERE loai_ve_id = @loaiVeId", {
    loaiVeId
  });
  if (!loaiVe) return apiFail(res, 400, "Loai ve khong hop le.");

  const gheIn = makeInClauseParams(danhSachGheId, "ghe");
  const dsGhe = await queryAll(
    `
        SELECT
          g.ghe_id AS gheId,
          g.ma_ghe AS maGhe,
          g.loai_ghe_id AS loaiGheId
        FROM ghe g
        WHERE g.phong_chieu_id = @phongChieuId
          AND g.ghe_id IN (${gheIn.inSql})
      `,
    { phongChieuId: suatChieu.phongChieuId, ...gheIn.params }
  );
  const distinctCount = Array.from(new Set(danhSachGheId)).length;
  if (dsGhe.length !== distinctCount) {
    return apiFail(res, 400, "Danh sach ghe khong hop le voi phong cua suat chieu.");
  }

  const daDatIn = makeInClauseParams(danhSachGheId, "ghe");
  const hasBooked = await queryOne(
    `
        SELECT TOP 1 1 AS x
        FROM ve
        WHERE suat_chieu_id = @suatChieuId
          AND ghe_id IN (${daDatIn.inSql})
          AND trang_thai <> 'HUY'
      `,
    { suatChieuId, ...daDatIn.params }
  );
  if (hasBooked) return apiFail(res, 409, "Co ghe da duoc dat. Vui long tai lai so do ghe.");

  const now = utcNowIso();
  let tongTien = 0;
  const danhSachGia = [];

  for (const ghe of dsGhe) {
    const gia = await tinhGiaVe(
      { phimId: suatChieu.phimId, phongChieuId: suatChieu.phongChieuId, thoiGianBatDau: suatChieu.thoiGianBatDau },
      { loaiGheId: ghe.loaiGheId }
    );
    if (gia <= 0) return apiFail(res, 400, `Chua cau hinh gia ve cho ghe ${ghe.maGhe}.`);
    tongTien += gia;
    danhSachGia.push({ gheId: ghe.gheId, maGhe: ghe.maGhe, giaVe: gia });
  }

  let tongGiam = 0;
  let maGiamGiaId = null;
  if (maCodeGiamGia) {
    const ma = await queryOne(
      `
          SELECT TOP 1
            ma_giam_gia_id AS maGiamGiaId,
            loai_giam AS loaiGiam,
            gia_tri_giam AS giaTriGiam
          FROM ma_giam_gia
          WHERE ma_code = @maCode
            AND trang_thai = 'HOAT_DONG'
            AND ngay_bat_dau <= @now
            AND ngay_ket_thuc >= @now
        `,
      { maCode: maCodeGiamGia, now }
    );
    if (ma) {
      maGiamGiaId = ma.maGiamGiaId;
      tongGiam = ma.loaiGiam === "PHAN_TRAM" ? (tongTien * Number(ma.giaTriGiam)) / 100 : Number(ma.giaTriGiam);
      if (tongGiam > tongTien) tongGiam = tongTien;
    }
  }

  const tongThanhToan = tongTien - tongGiam;
  const maDon = formatMaDonLikeCSharp(now);

  let donDatVeId = null;
  const tx = new sql.Transaction(await getPool());
  await tx.begin();
  try {
    const trangThaiDon = kenhDat === "QUAY" ? "DA_THANH_TOAN" : "CHO_THANH_TOAN";
    const donInsertRes = await queryOne(
      `
          INSERT INTO don_dat_ve (
            tai_khoan_id,
            ma_don,
            tong_tien_goc,
            tong_giam,
            tong_thanh_toan,
            trang_thai,
            kenh_dat,
            tao_luc
          )
          OUTPUT INSERTED.don_dat_ve_id AS donDatVeId
          VALUES (
            @taiKhoanId,
            @maDon,
            @tongTienGoc,
            @tongGiam,
            @tongThanhToan,
            @trangThaiDon,
            @kenhDat,
            @taoLuc
          )
        `,
      {
        taiKhoanId,
        maDon,
        tongTienGoc: tongTien,
        tongGiam,
        tongThanhToan,
        trangThaiDon,
        kenhDat,
        taoLuc: now
      },
      tx
    );

    donDatVeId = Number(donInsertRes?.donDatVeId);

    for (const item of danhSachGia) {
      await exec(
        `
            INSERT INTO ve (
              don_dat_ve_id,
              suat_chieu_id,
              ghe_id,
              loai_ve_id,
              gia_ve,
              ma_qr_ve,
              da_checkin,
              trang_thai
            )
            VALUES (
              @donDatVeId,
              @suatChieuId,
              @gheId,
              @loaiVeId,
              @giaVe,
              @maQrVeTemp,
              0,
              'HOP_LE'
            )
          `,
        {
          donDatVeId,
          suatChieuId,
          gheId: item.gheId,
          loaiVeId,
          giaVe: item.giaVe,
          maQrVeTemp: 'TMP_' + crypto.randomUUID().replace(/-/g, "")
        },
        tx
      );
    }

    if (maGiamGiaId != null) {
      await exec(
        `
            INSERT INTO su_dung_ma_giam_gia (
              ma_giam_gia_id,
              don_dat_ve_id,
              tai_khoan_id,
              so_tien_giam,
              tao_luc
            )
            VALUES (
              @maGiamGiaId,
              @donDatVeId,
              @taiKhoanId,
              @soTienGiam,
              @taoLuc
            )
          `,
        { maGiamGiaId, donDatVeId, taiKhoanId, soTienGiam: tongGiam, taoLuc: now },
        tx
      );
    }

    if (kenhDat === "QUAY") {
      // Create thanh_toan record instantly
      const pttt = await queryOne(`SELECT TOP 1 phuong_thuc_thanh_toan_id AS id FROM phuong_thuc_thanh_toan WHERE ma_phuong_thuc = 'TIEN_MAT'`, {}, tx);
      if (pttt) {
        await exec(`
          INSERT INTO thanh_toan (don_dat_ve_id, phuong_thuc_thanh_toan_id, so_tien, trang_thai, ghi_chu, thanh_toan_luc)
          VALUES (@donDatVeId, @ptttId, @soTien, 'THANH_CONG', N'Thanh toán tại quầy', @now)
        `, { donDatVeId, ptttId: pttt.id, soTien: tongThanhToan, now }, tx);
      }

      // Sinh mã QR chính thức ngay lập tức cho đơn tại quầy
      const veRows = await queryAll(`SELECT ve_id FROM ve WHERE don_dat_ve_id = @donDatVeId`, { donDatVeId }, tx);
      for (const vr of veRows) {
        const qr = `VE_${vr.ve_id}_${crypto.randomUUID().replace(/-/g, "")}`;
        await exec(`UPDATE ve SET ma_qr_ve = @qr WHERE ve_id = @ve_id`, { qr, ve_id: vr.ve_id }, tx);
      }
    }

    await tx.commit();

    // Lấy lại danh sách vé đầy đủ để trả về (đặc biệt là mã QR vừa sinh)
    const finalTickets = await queryAll(
      `SELECT v.ve_id AS veId, v.ghe_id AS gheId, v.gia_ve AS giaVe, v.ma_qr_ve AS maQrVe, g.ma_ghe AS maGhe
       FROM ve v
       JOIN ghe g ON v.ghe_id = g.ghe_id
       WHERE v.don_dat_ve_id = @donDatVeId`,
      { donDatVeId }
    );

    return apiOk(res, {
      donDatVeId,
      maDon,
      tongTienGoc: tongTien,
      tongGiam,
      tongThanhToan,
      danhSachVe: finalTickets
    });
  } catch (e) {
    await tx.rollback();
    return apiFail(res, 409, "Ghe vua duoc nguoi khac dat. Vui long dat lai.", { detail: String(e?.message || e) });
  }
}

async function thanhToan(req, res) {
  const request = req.body || {};
  const donDatVeId = Number(request.donDatVeId);
  const phuongThucThanhToanId = Number(request.phuongThucThanhToanId);
  const maGiaoDich = request.maGiaoDich ? String(request.maGiaoDich).trim() : "";
  const now = utcNowIso();

  const don = await queryOne("SELECT TOP 1 * FROM don_dat_ve WHERE don_dat_ve_id = @donDatVeId", { donDatVeId });
  if (!don) return apiFail(res, 404, "Khong tim thay don dat ve.");
  if (don.trang_thai === "DA_THANH_TOAN") return apiFail(res, 400, "Don da thanh toan.");

  const uid = req.user?.taiKhoanId != null ? Number(req.user.taiKhoanId) : null;
  const roles = req.user?.roles || [];
  const isStaff = roles.includes("ADMIN") || roles.includes("NHAN_VIEN");
  if (don.tai_khoan_id != null && Number(don.tai_khoan_id) !== uid && !isStaff) {
    return apiFail(res, 403, "Don khong thuoc tai khoan cua ban.");
  }

  const pttt = await queryOne(
    "SELECT TOP 1 phuong_thuc_thanh_toan_id AS phuongThucThanhToanId, ma_phuong_thuc AS maPhuongThuc FROM phuong_thuc_thanh_toan WHERE phuong_thuc_thanh_toan_id = @id",
    { id: phuongThucThanhToanId }
  );
  if (!pttt) return apiFail(res, 400, "Phuong thuc thanh toan khong hop le.");

  if (pttt.maPhuongThuc === "TIEN_MAT" && !isStaff) {
    return apiFail(res, 403, "Chi nhan vien moi duoc xac nhan thanh toan tien mat.");
  }

  const tx = new sql.Transaction(await getPool());
  await tx.begin();
  try {
    await exec(
      `
          INSERT INTO thanh_toan (
            don_dat_ve_id,
            phuong_thuc_thanh_toan_id,
            so_tien,
            ma_giao_dich,
            trang_thai,
            thanh_toan_luc
          )
          VALUES (
            @donDatVeId,
            @ptttId,
            @soTien,
            @maGiaoDich,
            'THANH_CONG',
            @thanhToanLuc
          )
        `,
      {
        donDatVeId,
        ptttId: phuongThucThanhToanId,
        soTien: don.tong_thanh_toan,
        maGiaoDich: maGiaoDich ? maGiaoDich : formatGiaoDichLikeCSharp(now),
        thanhToanLuc: now
      },
      tx
    );

    await exec(`UPDATE don_dat_ve SET trang_thai = 'DA_THANH_TOAN' WHERE don_dat_ve_id = @donDatVeId`, { donDatVeId }, tx);

    const veRows = await queryAll(
      `
          SELECT ve_id AS veId
          FROM ve
          WHERE don_dat_ve_id = @donDatVeId
        `,
      { donDatVeId },
      tx
    );

    for (const vr of veRows) {
      const qr = `VE_${vr.veId}_${crypto.randomUUID().replace(/-/g, "")}`;
      await exec(`UPDATE ve SET ma_qr_ve = @qr WHERE ve_id = @veId`, { qr, veId: vr.veId }, tx);
    }

    await tx.commit();

    const qrRows = await queryAll(`SELECT ma_qr_ve AS maQrVe FROM ve WHERE don_dat_ve_id = @donDatVeId`, {
      donDatVeId
    });

    return apiOk(res, {
      donDatVeId: don.don_dat_ve_id,
      maDon: don.ma_don,
      trangThai: "DA_THANH_TOAN",
      danhSachQrVe: qrRows.map((x) => x.maQrVe)
    });
  } catch (e) {
    await tx.rollback();
    return apiFail(res, 500, "Loi he thong, vui long thu lai sau.", { detail: String(e?.message || e) });
  }
}

async function getDon(req, res) {
  const uid = req.user?.taiKhoanId != null ? Number(req.user.taiKhoanId) : null;
  if (!uid) return apiFail(res, 401, "Can dang nhap.");

  const donDatVeId = Number(req.params.donDatVeId);
  if (!Number.isFinite(donDatVeId) || donDatVeId <= 0) return apiFail(res, 400, "Ma don khong hop le.");

  const don = await queryOne("SELECT TOP 1 * FROM don_dat_ve WHERE don_dat_ve_id = @donDatVeId", { donDatVeId });
  if (!don) return apiFail(res, 404, "Yeu cau khong hop le");

  const chuDonId = don.tai_khoan_id != null ? Number(don.tai_khoan_id) : don.taiKhoanId != null ? Number(don.taiKhoanId) : null;
  if (chuDonId == null || chuDonId !== uid) {
    return apiFail(res, 403, "Don khong thuoc tai khoan cua ban.");
  }

  const veMeta = await queryOne("SELECT TOP 1 suat_chieu_id FROM ve WHERE don_dat_ve_id = @donDatVeId", {
    donDatVeId
  });
  const suatVe =
    veMeta?.suat_chieu_id != null
      ? Number(veMeta.suat_chieu_id)
      : veMeta?.suatChieuId != null
        ? Number(veMeta.suatChieuId)
        : null;

  const ve = await queryAll(
    `
        SELECT
          v.ghe_id AS gheId,
          g.ma_ghe AS maGhe,
          v.gia_ve AS giaVe,
          v.ma_qr_ve AS qrVe
        FROM ve v
        JOIN ghe g ON g.ghe_id = v.ghe_id
        WHERE v.don_dat_ve_id = @donDatVeId
      `,
    { donDatVeId }
  );

  return apiOk(res, {
    donDatVeId: Number(don.don_dat_ve_id ?? don.donDatVeId),
    maDon: don.ma_don ?? don.maDon,
    trangThai: don.trang_thai ?? don.trangThai,
    tongTienGoc: Number(don.tong_tien_goc ?? don.tongTienGoc ?? 0),
    tongGiam: Number(don.tong_giam ?? don.tongGiam ?? 0),
    tongThanhToan: Number(don.tong_thanh_toan ?? don.tongThanhToan ?? 0),
    suatChieuId: suatVe,
    danhSachVe: ve.map((x) => ({
      gheId: Number(x.ghe_id ?? x.gheId),
      maGhe: x.ma_ghe ?? x.maGhe,
      giaVe: Number(x.gia_ve ?? x.giaVe ?? 0),
      qrVe: x.ma_qr_ve ?? x.qrVe
    }))
  });
}

async function lichSuDatVe(req, res) {
  const uid = req.user?.taiKhoanId != null ? Number(req.user.taiKhoanId) : null;
  if (!uid) return apiFail(res, 401, "Can dang nhap.");

  const rows = await queryAll(
    `
      SELECT
        d.don_dat_ve_id   AS donDatVeId,
        d.ma_don          AS maDon,
        d.tong_tien_goc   AS tongTienGoc,
        d.tong_giam       AS tongGiam,
        d.tong_thanh_toan AS tongThanhToan,
        d.trang_thai      AS trangThai,
        d.kenh_dat        AS kenhDat,
        d.tao_luc         AS taoLuc,
        p.ten_phim        AS tenPhim,
        p.poster_url      AS posterUrl,
        sc.thoi_gian_bat_dau AS thoiGianBatDau,
        pc.ten_phong      AS tenPhong,
        COUNT(v.ve_id)    AS soVe
      FROM don_dat_ve d
      LEFT JOIN ve v       ON v.don_dat_ve_id = d.don_dat_ve_id
      LEFT JOIN suat_chieu sc ON sc.suat_chieu_id = v.suat_chieu_id
      LEFT JOIN phim p     ON p.phim_id = sc.phim_id
      LEFT JOIN phong_chieu pc ON pc.phong_chieu_id = sc.phong_chieu_id
      WHERE d.tai_khoan_id = @uid
      GROUP BY
        d.don_dat_ve_id, d.ma_don, d.tong_tien_goc, d.tong_giam,
        d.tong_thanh_toan, d.trang_thai, d.kenh_dat, d.tao_luc,
        p.ten_phim, p.poster_url, sc.thoi_gian_bat_dau, pc.ten_phong
      ORDER BY d.tao_luc DESC
    `,
    { uid }
  );
  return apiOk(res, rows);
}

async function chiTietVeDayDu(req, res) {
  const uid = req.user?.taiKhoanId != null ? Number(req.user.taiKhoanId) : null;
  if (!uid) return apiFail(res, 401, "Can dang nhap.");

  const donDatVeId = Number(req.params.donDatVeId);
  if (!Number.isFinite(donDatVeId) || donDatVeId <= 0)
    return apiFail(res, 400, "Ma don khong hop le.");

  const don = await queryOne(
    "SELECT TOP 1 * FROM don_dat_ve WHERE don_dat_ve_id = @donDatVeId AND tai_khoan_id = @uid",
    { donDatVeId, uid }
  );
  if (!don) return apiFail(res, 404, "Khong tim thay don dat ve.");

  const danhSachVe = await queryAll(
    `
      SELECT
        v.ve_id         AS veId,
        v.gia_ve        AS giaVe,
        v.ma_qr_ve      AS maQrVe,
        v.da_checkin    AS daCheckin,
        v.checkin_luc   AS checkinLuc,
        v.trang_thai    AS trangThaiVe,
        g.ma_ghe        AS maGhe,
        g.hang_ghe      AS hangGhe,
        g.cot_ghe       AS cotGhe,
        lg.ten_loai     AS loaiGhe,
        lg.mau_hien_thi AS mauGhe,
        lv.ten_loai     AS loaiVe,
        p.ten_phim      AS tenPhim,
        p.poster_url    AS posterUrl,
        p.thoi_luong_phut AS thoiLuongPhut,
        sc.thoi_gian_bat_dau AS thoiGianBatDau,
        sc.thoi_gian_ket_thuc AS thoiGianKetThuc,
        pc.ten_phong    AS tenPhong,
        pc.ma_phong     AS maPhong
      FROM ve v
      JOIN ghe g           ON g.ghe_id = v.ghe_id
      JOIN loai_ghe lg     ON lg.loai_ghe_id = g.loai_ghe_id
      JOIN loai_ve lv      ON lv.loai_ve_id = v.loai_ve_id
      JOIN suat_chieu sc   ON sc.suat_chieu_id = v.suat_chieu_id
      JOIN phim p          ON p.phim_id = sc.phim_id
      JOIN phong_chieu pc  ON pc.phong_chieu_id = sc.phong_chieu_id
      WHERE v.don_dat_ve_id = @donDatVeId
      ORDER BY g.hang_ghe, g.cot_ghe
    `,
    { donDatVeId }
  );

  const thanhToanInfo = await queryOne(
    `SELECT tt.trang_thai AS trangThaiTT, tt.thanh_toan_luc, pt.ten_phuong_thuc AS phuongThuc
     FROM thanh_toan tt
     JOIN phuong_thuc_thanh_toan pt ON pt.phuong_thuc_thanh_toan_id = tt.phuong_thuc_thanh_toan_id
     WHERE tt.don_dat_ve_id = @donDatVeId`,
    { donDatVeId }
  );

  return apiOk(res, {
    donDatVeId: Number(don.don_dat_ve_id),
    maDon: don.ma_don,
    trangThai: don.trang_thai,
    kenhDat: don.kenh_dat,
    tongTienGoc: Number(don.tong_tien_goc),
    tongGiam: Number(don.tong_giam),
    tongThanhToan: Number(don.tong_thanh_toan),
    taoLuc: don.tao_luc,
    thanhToan: thanhToanInfo || null,
    danhSachVe: danhSachVe.map((v) => ({
      veId: Number(v.veId),
      maGhe: v.maGhe,
      hangGhe: v.hangGhe,
      cotGhe: v.cotGhe,
      loaiGhe: v.loaiGhe,
      mauGhe: v.mauGhe,
      loaiVe: v.loaiVe,
      giaVe: Number(v.giaVe),
      maQrVe: v.maQrVe,
      daCheckin: Boolean(v.daCheckin),
      checkinLuc: v.checkinLuc,
      trangThaiVe: v.trangThaiVe,
      tenPhim: v.tenPhim,
      posterUrl: v.posterUrl,
      thoiLuongPhut: v.thoiLuongPhut,
      thoiGianBatDau: v.thoiGianBatDau,
      thoiGianKetThuc: v.thoiGianKetThuc,
      tenPhong: v.tenPhong,
      maPhong: v.maPhong
    }))
  });
}

async function huyDon(req, res) {
  const id = Number(req.params.donDatVeId);
  if (!id) return apiFail(res, 400, "ID không hợp lệ.");

  const uid = req.user?.taiKhoanId;
  const roles = req.user?.roles || [];
  const isStaff = roles.includes("ADMIN") || roles.includes("NHAN_VIEN");

  const don = await queryOne("SELECT * FROM don_dat_ve WHERE don_dat_ve_id = @id", { id });
  if (!don) return apiFail(res, 404, "Không tìm thấy đơn hàng.");

  // Chỉ chủ đơn hoặc nhân viên mới được hủy
  if (don.tai_khoan_id != null && Number(don.tai_khoan_id) !== Number(uid) && !isStaff) {
    return apiFail(res, 403, "Bạn không có quyền hủy đơn này.");
  }

  if (don.trang_thai === "HUY") return apiFail(res, 400, "Đơn đã bị hủy trước đó.");

  await exec("UPDATE don_dat_ve SET trang_thai = 'HUY' WHERE don_dat_ve_id = @id", { id });
  // Cập nhật trạng thái vé liên quan
  await exec("UPDATE ve SET trang_thai = 'HUY' WHERE don_dat_ve_id = @id", { id });

  return apiOk(res, { donDatVeId: id }, "Hủy đơn hàng thành công.");
}

module.exports = {
  soDoGhe,
  listLoaiVe,
  listPhuongThucThanhToan,
  taoDon,
  thanhToan,
  getDon,
  lichSuDatVe,
  chiTietVeDayDu,
  huyDon
};
