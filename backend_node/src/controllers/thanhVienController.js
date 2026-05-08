const { queryAll, queryOne, exec } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");

async function listHangThanhVien(req, res) {
  const rows = await queryAll(`
    SELECT cau_hinh_id AS hangId, hang_thanh_vien AS tenHang,
      phan_tram_giam AS tyLeTichDiem, co_combo_vip AS diemToiThieu, mo_ta AS quyenLoi
    FROM cau_hinh_giam_gia_thanh_vien ORDER BY cau_hinh_id ASC
  `);
  return apiOk(res, rows);
}

async function createHangThanhVien(req, res) {
  const body = req.body || {};
  const tenHang = (body.tenHang || "").trim();
  const tyLeTichDiem = Number(body.tyLeTichDiem) || 0;
  const diemToiThieu = Number(body.diemToiThieu) > 0 ? 1 : 0;
  const quyenLoi = (body.quyenLoi || "").trim();
  if (!tenHang) return apiFail(res, 400, "Ten hang khong duoc de trong.");
  try {
    const result = await queryOne(`
      INSERT INTO cau_hinh_giam_gia_thanh_vien (hang_thanh_vien, phan_tram_giam, co_combo_vip, mo_ta)
      OUTPUT INSERTED.cau_hinh_id AS id
      VALUES (@tenHang, @tyLeTichDiem, @diemToiThieu, @quyenLoi)
    `, { tenHang, tyLeTichDiem, diemToiThieu, quyenLoi });
    return apiOk(res, { hangId: result.id }, "Tao hang thanh vien thanh cong", 201);
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

async function updateHangThanhVien(req, res) {
  const id = Number(req.params.id);
  const body = req.body || {};
  const tenHang = (body.tenHang || "").trim();
  const tyLeTichDiem = Number(body.tyLeTichDiem) || 0;
  const diemToiThieu = Number(body.diemToiThieu) > 0 ? 1 : 0;
  const quyenLoi = (body.quyenLoi || "").trim();
  if (!id || !tenHang) return apiFail(res, 400, "Thieu thong tin bat buoc.");
  try {
    await exec(`
      UPDATE cau_hinh_giam_gia_thanh_vien SET
        hang_thanh_vien = @tenHang, phan_tram_giam = @tyLeTichDiem,
        co_combo_vip = @diemToiThieu, mo_ta = @quyenLoi, cap_nhat_luc = SYSUTCDATETIME()
      WHERE cau_hinh_id = @id
    `, { tenHang, tyLeTichDiem, diemToiThieu, quyenLoi, id });
    return apiOk(res, { hangId: id });
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

async function listTheThanhVien(req, res) {
  const rows = await queryAll(`
    SELECT t.the_thanh_vien_id AS theId, t.tai_khoan_id AS taiKhoanId,
      tk.ho_ten AS hoTen, tk.email AS email, tk.so_dien_thoai AS soDienThoai,
      t.hang_thanh_vien AS tenHang, COALESCE(dt.so_diem, 0) AS diemKhaDung,
      t.ngay_bat_dau AS ngayPhatHanh, t.ngay_ket_thuc AS ngayHetHan, t.trang_thai AS trangThai
    FROM the_thanh_vien t
    JOIN tai_khoan tk ON t.tai_khoan_id = tk.tai_khoan_id
    LEFT JOIN diem_thuong dt ON t.tai_khoan_id = dt.tai_khoan_id
    ORDER BY t.ngay_bat_dau DESC
  `);
  return apiOk(res, rows.map(r => ({ ...r, maThe: "MBR" + String(r.taiKhoanId).padStart(6, "0") })));
}

/** GET /api/ThanhVien/the-cua-toi */
async function getMyThe(req, res) {
  const taiKhoanId = req.user?.taiKhoanId;
  if (!taiKhoanId) return apiFail(res, 401, "Chua xac thuc.");
  const the = await queryOne(`
    SELECT t.the_thanh_vien_id AS theId, t.tai_khoan_id AS taiKhoanId,
      t.hang_thanh_vien AS tenHang, COALESCE(dt.so_diem, 0) AS diemKhaDung,
      t.ngay_bat_dau AS ngayPhatHanh, t.ngay_ket_thuc AS ngayHetHan, t.trang_thai AS trangThai
    FROM the_thanh_vien t
    LEFT JOIN diem_thuong dt ON t.tai_khoan_id = dt.tai_khoan_id
    WHERE t.tai_khoan_id = @taiKhoanId
  `, { taiKhoanId });
  return apiOk(res, the ? { ...the, maThe: "MBR" + String(taiKhoanId).padStart(6, "0") } : null);
}

/** POST /api/ThanhVien/dang-ky */
async function dangKyThe(req, res) {
  const taiKhoanId = req.user?.taiKhoanId;
  if (!taiKhoanId) return apiFail(res, 401, "Chua xac thuc.");

  const existing = await queryOne(
    "SELECT TOP 1 the_thanh_vien_id AS theId, trang_thai AS trangThai FROM the_thanh_vien WHERE tai_khoan_id = @taiKhoanId",
    { taiKhoanId }
  );
  if (existing) return apiFail(res, 409, `Tai khoan da co the thanh vien (trang thai: ${existing.trangThai}).`);

  try {
    const ngayBatDau = new Date();
    const ngayKetThuc = new Date(ngayBatDau);
    ngayKetThuc.setFullYear(ngayKetThuc.getFullYear() + 1);

    const result = await queryOne(`
      INSERT INTO the_thanh_vien (tai_khoan_id, hang_thanh_vien, ngay_bat_dau, ngay_ket_thuc, trang_thai)
      OUTPUT INSERTED.the_thanh_vien_id AS theId
      VALUES (@taiKhoanId, 'THUONG', @ngayBatDau, @ngayKetThuc, 'HOAT_DONG')
    `, { taiKhoanId, ngayBatDau, ngayKetThuc });

    // Tạo điểm thưởng ban đầu nếu chưa có
    const hasDiem = await queryOne("SELECT TOP 1 1 AS x FROM diem_thuong WHERE tai_khoan_id = @taiKhoanId", { taiKhoanId });
    if (!hasDiem) await exec("INSERT INTO diem_thuong (tai_khoan_id, so_diem) VALUES (@taiKhoanId, 100)", { taiKhoanId });
    // Tặng 100 điểm chào mừng

    return apiOk(res, {
      theId: result.theId,
      maThe: "MBR" + String(taiKhoanId).padStart(6, "0"),
      tenHang: "THUONG",
      ngayPhatHanh: ngayBatDau,
      ngayHetHan: ngayKetThuc,
      trangThai: "HOAT_DONG",
      diemKhaDung: 100
    }, "Dang ky the thanh vien thanh cong! Tang 100 diem chao mung.", 201);
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

module.exports = { listHangThanhVien, createHangThanhVien, updateHangThanhVien, listTheThanhVien, getMyThe, dangKyThe };
