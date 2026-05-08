const { queryAll, queryOne, exec, execTransaction } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");

async function listPhongChieu(_req, res) {
  const rows = await queryAll(
    `SELECT
       phong_chieu_id AS phongChieuId,
       ma_phong AS maPhong,
       ten_phong AS tenPhong,
       loai_phong AS loaiPhong,
       so_hang AS soHang,
       so_cot AS soCot,
       suc_chua AS sucChua,
       trang_thai AS trangThai
     FROM phong_chieu
     ORDER BY ma_phong ASC`
  );
  return apiOk(res, rows);
}

async function getPhongChieu(req, res) {
  const id = Number(req.params.id);
  if (!id) return apiFail(res, 400, "ID phong chieu khong hop le.");

  const phong = await queryOne(
    `SELECT
       phong_chieu_id AS phongChieuId,
       ma_phong AS maPhong,
       ten_phong AS tenPhong,
       loai_phong AS loaiPhong,
       so_hang AS soHang,
       so_cot AS soCot,
       suc_chua AS sucChua,
       trang_thai AS trangThai
     FROM phong_chieu WHERE phong_chieu_id = @id`,
    { id }
  );

  if (!phong) return apiFail(res, 404, "Khong tim thay phong chieu.");
  return apiOk(res, phong);
}

// Logic sinh ghế: Sinh mảng ghế (vd: A1..A10, B1..B10) dựa trên hàng & cột.
function generateGheData(phongId, soHang, soCot, thuongId, vipId, doiId) {
  const gheArr = [];
  // Giả sử:
  // - 2 hàng đầu (A, B) là ghế thường.
  // - Các hàng giữa là VIP.
  // - Hàng cuối cùng là ghế đôi (nếu có đủ số hàng, nếu không thì ko có).
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
  for (let r = 0; r < soHang; r++) {
    const hang = alphabet[r] || `H${r}`;
    
    // Logic đơn giản xác định loại ghế:
    let loaiGheId = thuongId;
    if (soHang > 3) {
      if (r === soHang - 1) {
        loaiGheId = doiId || thuongId; // hàng cuối là ghế đôi
      } else if (r >= 2 && r < soHang - 1) {
        loaiGheId = vipId || thuongId; // sau 2 hàng đầu, trước hàng cuối là VIP
      }
    }

    for (let c = 1; c <= soCot; c++) {
      let cot = c.toString();
      // Với ghế đôi, thường chỉ xếp 1/2 cột (vì nó rộng), nhưng ở đây tạm để full cột cho đơn giản.
      const maGhe = `${hang}${cot}`;
      gheArr.push({
        phong_chieu_id: phongId,
        loai_ghe_id: loaiGheId,
        ma_ghe: maGhe,
        hang_ghe: hang,
        cot_ghe: c,
        trang_thai: "HOAT_DONG"
      });
    }
  }
  return gheArr;
}

async function createPhongChieu(req, res) {
  const body = req.body || {};
  const maPhong = (body.maPhong || "").trim();
  const tenPhong = (body.tenPhong || "").trim();
  const loaiPhong = (body.loaiPhong || "THUONG").trim();
  const soHang = Number(body.soHang) || 0;
  const soCot = Number(body.soCot) || 0;

  if (!maPhong || !tenPhong) return apiFail(res, 400, "Ma phong va ten phong la bat buoc.");
  if (soHang < 1 || soHang > 26 || soCot < 1 || soCot > 50) return apiFail(res, 400, "So hang (1-26) hoac so cot (1-50) khong hop le.");

  const sucChua = soHang * soCot;

  const check = await queryOne("SELECT TOP 1 1 AS x FROM phong_chieu WHERE ma_phong = @ma", { ma: maPhong });
  if (check) return apiFail(res, 409, "Ma phong da ton tai.");

  // Lấy ID loại ghế
  const thuong = await queryOne("SELECT TOP 1 loai_ghe_id AS id FROM loai_ghe WHERE ma_loai = 'THUONG'");
  const vip = await queryOne("SELECT TOP 1 loai_ghe_id AS id FROM loai_ghe WHERE ma_loai = 'VIP'");
  const doi = await queryOne("SELECT TOP 1 loai_ghe_id AS id FROM loai_ghe WHERE ma_loai = 'DOI'");

  const thuongId = thuong?.id;
  if (!thuongId) return apiFail(res, 500, "Chua cau hinh loai ghe THUONG trong he thong.");

  try {
    const phongIdRes = await execTransaction(async (transaction) => {
      const q = `
        INSERT INTO phong_chieu (ma_phong, ten_phong, loai_phong, so_hang, so_cot, suc_chua, trang_thai)
        OUTPUT INSERTED.phong_chieu_id
        VALUES (@ma, @ten, @loai, @hang, @cot, @suc, 'HOAT_DONG')
      `;
      const result = await transaction.request()
        .input("ma", maPhong)
        .input("ten", tenPhong)
        .input("loai", loaiPhong)
        .input("hang", soHang)
        .input("cot", soCot)
        .input("suc", sucChua)
        .query(q);
      
      const newPhongId = result.recordset[0].phong_chieu_id;

      // Sinh ghế
      const gheArr = generateGheData(newPhongId, soHang, soCot, thuongId, vip?.id, doi?.id);
      
      for (const g of gheArr) {
        const iq = `
          INSERT INTO ghe (phong_chieu_id, loai_ghe_id, ma_ghe, hang_ghe, cot_ghe, trang_thai)
          VALUES (@pid, @lid, @mg, @hg, @cg, @st)
        `;
        await transaction.request()
          .input("pid", g.phong_chieu_id)
          .input("lid", g.loai_ghe_id)
          .input("mg", g.ma_ghe)
          .input("hg", g.hang_ghe)
          .input("cg", g.cot_ghe)
          .input("st", g.trang_thai)
          .query(iq);
      }
      return newPhongId;
    });

    return apiOk(res, { phongChieuId: phongIdRes }, "Tao phong va sinh ghe thanh cong", 201);
  } catch (err) {
    return apiFail(res, 500, err.message);
  }
}

async function updatePhongChieu(req, res) {
  const id = Number(req.params.id);
  if (!id) return apiFail(res, 400, "ID khong hop le.");

  const body = req.body || {};
  const maPhong = (body.maPhong || "").trim();
  const tenPhong = (body.tenPhong || "").trim();
  const loaiPhong = (body.loaiPhong || "").trim();
  const trangThai = (body.trangThai || "").trim();

  if (!maPhong || !tenPhong) return apiFail(res, 400, "Ma phong va ten phong khong duoc de trong.");

  const check = await queryOne("SELECT TOP 1 1 AS x FROM phong_chieu WHERE ma_phong = @ma AND phong_chieu_id <> @id", { ma: maPhong, id });
  if (check) return apiFail(res, 409, "Ma phong da ton tai o phong khac.");

  await exec(
    `UPDATE phong_chieu SET 
       ma_phong = @ma, ten_phong = @ten, loai_phong = @loai, trang_thai = @st, cap_nhat_luc = SYSUTCDATETIME()
     WHERE phong_chieu_id = @id`,
    { ma: maPhong, ten: tenPhong, loai: loaiPhong, st: trangThai, id }
  );

  return apiOk(res, { phongChieuId: id });
}

async function listGheTheoPhong(req, res) {
  const id = Number(req.params.id);
  if (!id) return apiFail(res, 400, "ID khong hop le.");

  const rows = await queryAll(
    `SELECT
       g.ghe_id AS gheId,
       g.ma_ghe AS maGhe,
       g.hang_ghe AS hangGhe,
       g.cot_ghe AS cotGhe,
       g.trang_thai AS trangThai,
       lg.ten_loai AS loaiGhe,
       lg.mau_hien_thi AS mauHienThi
     FROM ghe g
     JOIN loai_ghe lg ON lg.loai_ghe_id = g.loai_ghe_id
     WHERE g.phong_chieu_id = @id
     ORDER BY g.hang_ghe, g.cot_ghe`,
    { id }
  );
  return apiOk(res, rows);
}

/** PATCH /:id/ghe/:gheId — Đổi loại ghế đơn lẻ */
async function updateLoaiGhe(req, res) {
  const phongId = Number(req.params.id);
  const gheId   = Number(req.params.gheId);
  const { maLoai } = req.body || {};
  if (!phongId || !gheId) return apiFail(res, 400, "ID khong hop le.");
  if (!maLoai) return apiFail(res, 400, "Can truyen maLoai.");

  const ma = maLoai.toUpperCase();
  if (ma === "BAO_TRI") {
    await exec("UPDATE ghe SET trang_thai = 'BAO_TRI' WHERE ghe_id = @gheId AND phong_chieu_id = @phongId", { gheId, phongId });
    return apiOk(res, { gheId, trangThai: "BAO_TRI" });
  }

  const loaiGhe = await queryOne("SELECT TOP 1 loai_ghe_id AS id FROM loai_ghe WHERE ma_loai = @ma", { ma });
  if (!loaiGhe) return apiFail(res, 404, `Khong tim thay loai ghe: ${ma}`);

  await exec(
    "UPDATE ghe SET loai_ghe_id = @loaiId, trang_thai = 'HOAT_DONG' WHERE ghe_id = @gheId AND phong_chieu_id = @phongId",
    { loaiId: loaiGhe.id, gheId, phongId }
  );
  return apiOk(res, { gheId, maLoai: ma, trangThai: "HOAT_DONG" });
}

/** POST /:id/ghe/bulk-update — Đổi loại ghế hàng loạt [{gheId, maLoai}] */
async function bulkUpdateLoaiGhe(req, res) {
  const phongId = Number(req.params.id);
  if (!phongId) return apiFail(res, 400, "ID phong khong hop le.");

  const items = Array.isArray(req.body) ? req.body : [];
  if (!items.length) return apiFail(res, 400, "Can truyen mang [{gheId, maLoai}].");

  const loaiMap = {};
  const loaiRows = await queryAll("SELECT loai_ghe_id AS id, ma_loai AS maLoai FROM loai_ghe");
  loaiRows.forEach(l => { loaiMap[l.maLoai.toUpperCase()] = l.id; });

  let updated = 0;
  for (const item of items) {
    const gId = Number(item.gheId);
    const maL = String(item.maLoai || "").toUpperCase();
    
    if (maL === "BAO_TRI") {
      await exec("UPDATE ghe SET trang_thai = 'BAO_TRI' WHERE ghe_id = @gheId AND phong_chieu_id = @phongId", { gheId: gId, phongId });
      updated++;
      continue;
    }

    const loaiId = loaiMap[maL];
    if (!gId || !loaiId) continue;
    await exec(
      "UPDATE ghe SET loai_ghe_id = @loaiId, trang_thai = 'HOAT_DONG' WHERE ghe_id = @gheId AND phong_chieu_id = @phongId",
      { loaiId, gheId: gId, phongId }
    );
    updated++;
  }
  return apiOk(res, { updated }, `Da cap nhat ${updated} ghe.`);
}

module.exports = {
  listPhongChieu,
  getPhongChieu,
  createPhongChieu,
  updatePhongChieu,
  listGheTheoPhong,
  updateLoaiGhe,
  bulkUpdateLoaiGhe
};
