const { queryOne, queryAll, exec } = require("../db/queries");
const { apiOk, apiFail } = require("../utils/apiResponse");

let ensureTablePromise = null;

async function ensureQrThanhToanTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = exec(`
      IF OBJECT_ID(N'dbo.qr_thanh_toan', N'U') IS NULL
      BEGIN
        CREATE TABLE dbo.qr_thanh_toan (
          qr_thanh_toan_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
          ten_hien_thi NVARCHAR(200) NOT NULL,
          url_anh_qr NVARCHAR(1000) NOT NULL,
          huong_dan NVARCHAR(1000) NULL,
          thu_tu INT NOT NULL CONSTRAINT DF_qr_thanh_toan_thu_tu DEFAULT (0),
          hoat_dong BIT NOT NULL CONSTRAINT DF_qr_thanh_toan_hoat_dong DEFAULT (1)
        );
      END
    `).catch((err) => {
      ensureTablePromise = null;
      throw err;
    });
  }
  return ensureTablePromise;
}

function normalizeRow(r) {
  if (!r) return r;
  return {
    qrThanhToanId: Number(r.qrThanhToanId),
    tenHienThi: r.tenHienThi,
    urlAnhQr: r.urlAnhQr,
    huongDan: r.huongDan ?? "",
    thuTu: Number(r.thuTu ?? 0),
    hoatDong: Boolean(r.hoatDong)
  };
}

/** Khách đặt vé: chỉ mục đang bật, sắp xếp thứ tự */
async function listPublic(_req, res) {
  await ensureQrThanhToanTable();
  const rows = await queryAll(
    `
        SELECT
          qr_thanh_toan_id AS qrThanhToanId,
          ten_hien_thi AS tenHienThi,
          url_anh_qr AS urlAnhQr,
          huong_dan AS huongDan,
          thu_tu AS thuTu,
          hoat_dong AS hoatDong
        FROM dbo.qr_thanh_toan
        WHERE hoat_dong = 1
        ORDER BY thu_tu ASC, qr_thanh_toan_id ASC
      `
  );
  return apiOk(res, rows.map(normalizeRow));
}

async function listAdmin(_req, res) {
  await ensureQrThanhToanTable();
  const rows = await queryAll(
    `
        SELECT
          qr_thanh_toan_id AS qrThanhToanId,
          ten_hien_thi AS tenHienThi,
          url_anh_qr AS urlAnhQr,
          huong_dan AS huongDan,
          thu_tu AS thuTu,
          hoat_dong AS hoatDong
        FROM dbo.qr_thanh_toan
        ORDER BY thu_tu ASC, qr_thanh_toan_id ASC
      `
  );
  return apiOk(res, rows.map(normalizeRow));
}

async function createQr(req, res) {
  await ensureQrThanhToanTable();
  const body = req.body || {};
  const tenHienThi = body.tenHienThi != null ? String(body.tenHienThi).trim() : "";
  const urlAnhQr = body.urlAnhQr != null ? String(body.urlAnhQr).trim() : "";
  const huongDan = body.huongDan != null ? String(body.huongDan).trim() : "";
  const thuTu = body.thuTu != null && body.thuTu !== "" ? Number(body.thuTu) : 0;
  const hoatDong = body.hoatDong === false || body.hoatDong === 0 ? 0 : 1;

  if (!tenHienThi) return apiFail(res, 400, "Can nhap ten hien thi.");
  if (!urlAnhQr) return apiFail(res, 400, "Can nhap URL anh QR.");

  const ins = await queryOne(
    `
        INSERT INTO dbo.qr_thanh_toan (ten_hien_thi, url_anh_qr, huong_dan, thu_tu, hoat_dong)
        OUTPUT
          INSERTED.qr_thanh_toan_id AS qrThanhToanId,
          INSERTED.ten_hien_thi AS tenHienThi,
          INSERTED.url_anh_qr AS urlAnhQr,
          INSERTED.huong_dan AS huongDan,
          INSERTED.thu_tu AS thuTu,
          INSERTED.hoat_dong AS hoatDong
        VALUES (@tenHienThi, @urlAnhQr, @huongDan, @thuTu, @hoatDong)
      `,
    {
      tenHienThi,
      urlAnhQr,
      huongDan: huongDan || null,
      thuTu: Number.isFinite(thuTu) ? thuTu : 0,
      hoatDong
    }
  );
  return apiOk(res, normalizeRow(ins));
}

async function updateQr(req, res) {
  await ensureQrThanhToanTable();
  const id = Number(req.params.qrThanhToanId);
  if (!Number.isFinite(id) || id <= 0) return apiFail(res, 400, "Ma QR khong hop le.");

  const cur = await queryOne("SELECT TOP 1 qr_thanh_toan_id AS id FROM dbo.qr_thanh_toan WHERE qr_thanh_toan_id = @id", {
    id
  });
  if (!cur) return apiFail(res, 404, "Khong tim thay QR.");

  const body = req.body || {};
  const tenHienThi = body.tenHienThi != null ? String(body.tenHienThi).trim() : "";
  const urlAnhQr = body.urlAnhQr != null ? String(body.urlAnhQr).trim() : "";
  const huongDan = body.huongDan != null ? String(body.huongDan).trim() : "";
  const thuTu = body.thuTu != null && body.thuTu !== "" ? Number(body.thuTu) : 0;
  const hoatDong = body.hoatDong === false || body.hoatDong === 0 ? 0 : 1;

  if (!tenHienThi) return apiFail(res, 400, "Can nhap ten hien thi.");
  if (!urlAnhQr) return apiFail(res, 400, "Can nhap URL anh QR.");

  await exec(
    `
        UPDATE dbo.qr_thanh_toan
        SET ten_hien_thi = @tenHienThi,
            url_anh_qr = @urlAnhQr,
            huong_dan = @huongDan,
            thu_tu = @thuTu,
            hoat_dong = @hoatDong
        WHERE qr_thanh_toan_id = @id
      `,
    {
      id,
      tenHienThi,
      urlAnhQr,
      huongDan: huongDan || null,
      thuTu: Number.isFinite(thuTu) ? thuTu : 0,
      hoatDong
    }
  );

  const row = await queryOne(
    `
        SELECT
          qr_thanh_toan_id AS qrThanhToanId,
          ten_hien_thi AS tenHienThi,
          url_anh_qr AS urlAnhQr,
          huong_dan AS huongDan,
          thu_tu AS thuTu,
          hoat_dong AS hoatDong
        FROM dbo.qr_thanh_toan
        WHERE qr_thanh_toan_id = @id
      `,
    { id }
  );
  return apiOk(res, normalizeRow(row));
}

async function deleteQr(req, res) {
  await ensureQrThanhToanTable();
  const id = Number(req.params.qrThanhToanId);
  if (!Number.isFinite(id) || id <= 0) return apiFail(res, 400, "Ma QR khong hop le.");

  const cur = await queryOne("SELECT TOP 1 qr_thanh_toan_id AS id FROM dbo.qr_thanh_toan WHERE qr_thanh_toan_id = @id", {
    id
  });
  if (!cur) return apiFail(res, 404, "Khong tim thay QR.");

  await exec("DELETE FROM dbo.qr_thanh_toan WHERE qr_thanh_toan_id = @id", { id });
  return apiOk(res, { qrThanhToanId: id });
}

module.exports = { listPublic, listAdmin, createQr, updateQr, deleteQr };
