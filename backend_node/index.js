const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./openapi.json");
// Tedious (mssql mặc định): trên Windows hỗ trợ Windows Auth qua authentication.type = 'default'
const sql = require("mssql");

dotenv.config();

const PORT = Number(process.env.PORT || 5000);
const CORS_ORIGINS = (process.env.CORS_ORIGIN ||
  "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING;
if (!DB_CONNECTION_STRING) {
  throw new Error("Missing env DB_CONNECTION_STRING");
}

const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const JWT_ACCESS_TOKEN_MINUTES = Number(process.env.JWT_ACCESS_TOKEN_MINUTES || 180);
if (!JWT_ISSUER || !JWT_AUDIENCE || !JWT_SECRET_KEY) {
  throw new Error("Missing env JWT config");
}

// ClaimTypes.Role trong .NET = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
const JWT_ROLE_CLAIM_URI = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

const app = express();
app.set("trust proxy", true);

app.use(
  cors({
    origin: CORS_ORIGINS.length === 1 ? CORS_ORIGINS[0] : CORS_ORIGINS,
    credentials: false,
    allowedHeaders: ["Authorization", "Content-Type"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  })
);

app.use(express.json({ limit: "50mb" }));

// Serve uploaded files giống .NET: /uploads/... (trong wwwroot/uploads)
const wwwrootUploadsRoot = path.join(process.cwd(), "wwwroot", "uploads");
app.use("/uploads", express.static(wwwrootUploadsRoot));

function apiOk(res, data, message = "Thanh cong", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function apiFail(res, statusCode, message, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
}

function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Default error payload (giống ExceptionHandlingMiddleware của .NET)
app.use((err, req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  if (res.headersSent) return;
  apiFail(res, 500, "Loi he thong, vui long thu lai sau.");
});

let poolPromise = null;

function sqlUniqueViolationMessage(err) {
  const n = err?.number ?? err?.originalError?.info?.number;
  if (n === 2627 || n === 2601) {
    return "Email hoac so dien thoai da duoc su dung.";
  }
  return null;
}

function parseConnParts(raw) {
  return String(raw)
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .reduce((acc, kv) => {
      const idx = kv.indexOf("=");
      if (idx === -1) return acc;
      const k = kv.slice(0, idx).trim();
      const v = kv.slice(idx + 1).trim();
      acc[k] = v;
      return acc;
    }, {});
}

async function getPool() {
  if (poolPromise) return poolPromise;

  const parts = parseConnParts(DB_CONNECTION_STRING);

  let server = parts.Server || parts.server || parts["DATA SOURCE"] || parts["Data Source"];
  const database = parts.Database || parts.database || parts["INITIAL CATALOG"] || parts["Initial Catalog"];
  if (!server || !database) {
    throw new Error("DB_CONNECTION_STRING thieu Server hoac Database.");
  }

  let port = undefined;
  if (server.includes(",")) {
    const [h, p] = server.split(",").map((s) => s.trim());
    server = h;
    const n = Number(p);
    if (Number.isFinite(n)) port = n;
  }

  const encrypt = String(parts.Encrypt || parts.encrypt || "true").toLowerCase() === "true";
  const trustServerCertificate =
    String(parts.TrustServerCertificate || parts.trustServerCertificate || "true").toLowerCase() === "true";
  const integratedRaw = String(
    parts["Integrated Security"] || parts.integrated_security || ""
  ).toLowerCase();
  const integratedOn =
    integratedRaw === "true" || integratedRaw === "yes" || integratedRaw === "sspi";
  const trustedConnection =
    String(parts.Trusted_Connection || parts.trusted_connection || "false").toLowerCase() === "true" ||
    integratedOn;

  const connectTimeoutSec = Number(parts["Connect Timeout"] || parts.ConnectionTimeout || 30);
  const connectTimeout = Number.isFinite(connectTimeoutSec) ? connectTimeoutSec * 1000 : 30000;

  const user = parts["User ID"] || parts.Uid || parts.UserId;
  const password = parts.Password || parts.Pwd;

  const config = {
    server,
    database,
    port,
    options: {
      encrypt,
      trustServerCertificate,
      enableArithAbort: true,
      connectTimeout
    }
  };

  if (trustedConnection || (!user && !password)) {
    config.authentication = { type: "default" };
  } else {
    config.user = user;
    config.password = password;
  }

  poolPromise = new sql.ConnectionPool(config).connect();
  return poolPromise;
}

async function queryOne(sqlText, params = {}, tx = null) {
  const pool = await getPool();
  const request = tx ? new sql.Request(tx) : pool.request();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) {
      const key = k.toLowerCase();
      if (key.includes("taikhoanid")) {
        request.input(k, sql.BigInt, null);
      } else if (key.endsWith("id") || key.includes("id_")) {
        request.input(k, sql.BigInt, null);
      } else {
        request.input(k, sql.NVarChar, null);
      }
    } else {
      request.input(k, v);
    }
  }
  const result = await request.query(sqlText);
  return result.recordset?.[0] ?? null;
}

async function queryAll(sqlText, params = {}, tx = null) {
  const pool = await getPool();
  const request = tx ? new sql.Request(tx) : pool.request();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) {
      const key = k.toLowerCase();
      if (key.includes("taikhoanid")) {
        request.input(k, sql.BigInt, null);
      } else if (key.endsWith("id") || key.includes("id_")) {
        request.input(k, sql.BigInt, null);
      } else {
        request.input(k, sql.NVarChar, null);
      }
    } else {
      request.input(k, v);
    }
  }
  const result = await request.query(sqlText);
  return result.recordset ?? [];
}

async function exec(sqlText, params = {}, tx = null) {
  const pool = await getPool();
  const request = tx ? new sql.Request(tx) : pool.request();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) {
      const key = k.toLowerCase();
      if (key.includes("taikhoanid")) {
        request.input(k, sql.BigInt, null);
      } else if (key.endsWith("id") || key.includes("id_")) {
        request.input(k, sql.BigInt, null);
      } else {
        request.input(k, sql.NVarChar, null);
      }
    } else {
      request.input(k, v);
    }
  }
  await request.query(sqlText);
}

function parseRoleList(decoded) {
  const raw = decoded?.[JWT_ROLE_CLAIM_URI];
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  return [String(raw)];
}

function requireAuth(requiredRoles = []) {
  return asyncHandler(async (req, res, next) => {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return apiFail(res, 401, "Unauthorized");

    const token = match[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET_KEY, {
        algorithms: ["HS256"],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      });
    } catch (_e) {
      return apiFail(res, 401, "Unauthorized");
    }

    const roles = parseRoleList(decoded);
    const taiKhoanId = decoded?.taiKhoanId ? Number(decoded.taiKhoanId) : decoded?.sub ? Number(decoded.sub) : null;
    req.user = {
      taiKhoanId,
      roles,
      hoTen: decoded?.unique_name || decoded?.uniqueName || null
    };

    if (requiredRoles.length > 0) {
      const ok = requiredRoles.some((r) => roles.includes(r));
      if (!ok) return apiFail(res, 403, "Forbidden");
    }

    return next();
  });
}

function hashMatKhau(matKhau) {
  const iterations = 100_000;
  const saltSize = 16;
  const keySize = 32;

  const salt = crypto.randomBytes(saltSize);
  const hash = crypto.pbkdf2Sync(matKhau, salt, iterations, keySize, "sha256");
  return `${iterations}.${salt.toString("base64")}.${hash.toString("base64")}`;
}

function KiemTraMatKhau(matKhau, matKhauHash) {
  try {
    const parts = String(matKhauHash).split(".");
    if (parts.length !== 3) return false;
    const iterations = Number(parts[0]);
    if (!Number.isFinite(iterations)) return false;

    const salt = Buffer.from(parts[1], "base64");
    const expectedHash = Buffer.from(parts[2], "base64");
    const actualHash = crypto.pbkdf2Sync(matKhau, salt, iterations, expectedHash.length, "sha256");
    return crypto.timingSafeEqual(actualHash, expectedHash);
  } catch {
    return false;
  }
}

function TaoOtp(doDai = 6) {
  // giống RandomNumberGenerator.GetInt32(0, 10^doDai)
  const max = 10 ** doDai;
  const value = crypto.randomInt(0, max);
  return String(value).padStart(doDai, "0");
}

function TaoAccessToken(taiKhoanId, hoTen, vaiTro) {
  const claims = {
    sub: String(taiKhoanId),
    unique_name: hoTen,
    taiKhoanId: String(taiKhoanId),
    // claim type URI phải giống .NET ClaimTypes.Role
    [JWT_ROLE_CLAIM_URI]: vaiTro
  };

  return jwt.sign(claims, JWT_SECRET_KEY, {
    algorithm: "HS256",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: JWT_ACCESS_TOKEN_MINUTES * 60
  });
}

function utcNowIso() {
  return new Date();
}

function formatMaDonLikeCSharp(d) {
  const yyyy = String(d.getUTCFullYear());
  const MM = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const HH = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  const fff = String(d.getUTCMilliseconds()).padStart(3, "0");
  const random3 = String(crypto.randomInt(100, 999));
  return `DV${yyyy}${MM}${dd}${HH}${mm}${ss}${fff}${random3}`;
}

function formatGiaoDichLikeCSharp(d) {
  const yyyy = String(d.getUTCFullYear());
  const MM = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const HH = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  const fff = String(d.getUTCMilliseconds()).padStart(3, "0");
  return `GD${yyyy}${MM}${dd}${HH}${mm}${ss}${fff}`;
}

function makeInClauseParams(values, baseName = "id") {
  // values: array of primitives
  const unique = Array.from(new Set(values)).filter((v) => v !== null && v !== undefined);
  const placeholders = unique.map((_, i) => `@${baseName}${i}`);
  const params = {};
  unique.forEach((v, i) => {
    params[`${baseName}${i}`] = v;
  });
  return { inSql: placeholders.join(", "), params, values: unique };
}

// --------------------- Auth (public) ---------------------
app.post(
  "/api/Auth/dang-ky",
  asyncHandler(async (req, res) => {
    const request = req.body || {};
    const email = request.email ? String(request.email).trim() : "";
    const soDienThoai = request.soDienThoai ? String(request.soDienThoai).trim() : "";
    const hoTen = request.hoTen;
    const matKhau = request.matKhau;

    if (!email && !soDienThoai) return apiFail(res, 400, "Can nhap email hoac so dien thoai.");
    if (!hoTen || !String(hoTen).trim()) return apiFail(res, 400, "Can nhap ho ten.");
    if (!matKhau || !String(matKhau)) return apiFail(res, 400, "Can nhap mat khau.");

    try {
    if (email) {
      const exists = await queryOne("SELECT TOP 1 1 AS x FROM tai_khoan WHERE email = @email", { email });
      if (exists) return apiFail(res, 409, "Email da duoc su dung.");
    }
    if (soDienThoai) {
      const exists = await queryOne("SELECT TOP 1 1 AS x FROM tai_khoan WHERE so_dien_thoai = @soDienThoai", { soDienThoai });
      if (exists) return apiFail(res, 409, "So dien thoai da duoc su dung.");
    }

    const now = utcNowIso();
    const taiKhoanInsertSql = `
      INSERT INTO tai_khoan (email, so_dien_thoai, ho_ten, mat_khau_hash, trang_thai, tao_luc, cap_nhat_luc)
      OUTPUT INSERTED.tai_khoan_id AS taiKhoanId
      VALUES (@email, @soDienThoai, @hoTen, @matKhauHash, 'HOAT_DONG', @taoLuc, @capNhatLuc)
    `;

    const insertRes = await queryOne(taiKhoanInsertSql, {
      email: email || null,
      soDienThoai: soDienThoai || null,
      hoTen: String(hoTen).trim(),
      matKhauHash: hashMatKhau(String(matKhau)),
      taoLuc: now,
      capNhatLuc: now
    });

    const taiKhoanId = Number(insertRes?.taiKhoanId);

    const vaiTroKhach = await queryOne(
      "SELECT TOP 1 vai_tro_id AS vaiTroId FROM vai_tro WHERE ma_vai_tro = 'KHACH_HANG'",
      {}
    );
    if (vaiTroKhach?.vaiTroId) {
      await exec(
        `
          INSERT INTO tai_khoan_vai_tro (tai_khoan_id, vai_tro_id, tao_luc)
          VALUES (@taiKhoanId, @vaiTroId, @taoLuc)
        `,
        { taiKhoanId, vaiTroId: vaiTroKhach.vaiTroId, taoLuc: now }
      );
    }

    const vaiTroList = await queryAll(
      `
        SELECT vt.ma_vai_tro AS role
        FROM tai_khoan_vai_tro tvr
        JOIN vai_tro vt ON vt.vai_tro_id = tvr.vai_tro_id
        WHERE tvr.tai_khoan_id = @taiKhoanId
      `,
      { taiKhoanId }
    );
    const roles = vaiTroList.map((x) => x.role);

    const token = TaoAccessToken(taiKhoanId, String(hoTen).trim(), roles);

    return apiOk(res, {
      taiKhoanId,
      hoTen: String(hoTen).trim(),
      email: email || null,
      soDienThoai: soDienThoai || null,
      accessToken: token,
      vaiTro: roles
    });
    } catch (err) {
      const u = sqlUniqueViolationMessage(err);
      if (u) return apiFail(res, 409, u);
      throw err;
    }
  })
);

app.post(
  "/api/Auth/dang-nhap",
  asyncHandler(async (req, res) => {
    const request = req.body || {};
    const accountKey = request.emailOrSoDienThoai ? String(request.emailOrSoDienThoai).trim() : "";
    const matKhau = request.matKhau ? String(request.matKhau) : "";

    if (!accountKey) return apiFail(res, 400, "Can nhap email hoac so dien thoai.");

    const taiKhoan = await queryOne(
      `
        SELECT TOP 1 *
        FROM tai_khoan
        WHERE email = @accountKey OR so_dien_thoai = @accountKey
      `,
      { accountKey }
    );

    if (!taiKhoan) return apiFail(res, 401, "Thong tin dang nhap khong dung.");
    const okPass = KiemTraMatKhau(matKhau, taiKhoan.mat_khau_hash);
    if (!okPass) return apiFail(res, 401, "Thong tin dang nhap khong dung.");
    if (taiKhoan.trang_thai !== "HOAT_DONG") return apiFail(res, 400, "Tai khoan khong hoat dong.");

    const vaiTroRows = await queryAll(
      `
        SELECT vt.ma_vai_tro AS role
        FROM tai_khoan_vai_tro tvr
        JOIN vai_tro vt ON vt.vai_tro_id = tvr.vai_tro_id
        WHERE tvr.tai_khoan_id = @taiKhoanId
      `,
      { taiKhoanId: taiKhoan.tai_khoan_id }
    );
    const roles = vaiTroRows.map((x) => x.role);

    const token = TaoAccessToken(taiKhoan.tai_khoan_id, taiKhoan.ho_ten, roles);

    return apiOk(res, {
      taiKhoanId: taiKhoan.tai_khoan_id,
      hoTen: taiKhoan.ho_ten,
      email: taiKhoan.email,
      soDienThoai: taiKhoan.so_dien_thoai,
      accessToken: token,
      vaiTro: roles
    });
  })
);

app.post(
  "/api/Auth/quen-mat-khau/gui-otp",
  asyncHandler(async (req, res) => {
    const request = req.body || {};
    const email = request.email ? String(request.email).trim() : "";
    const soDienThoai = request.soDienThoai ? String(request.soDienThoai).trim() : "";

    if (!email && !soDienThoai) return apiFail(res, 400, "Can nhap email hoac so dien thoai.");

    const taiKhoan = await queryOne(
      `
        SELECT TOP 1 *
        FROM tai_khoan
        WHERE
          (@email IS NOT NULL AND LTRIM(RTRIM(@email)) <> '' AND email = @email)
          OR
          (@soDienThoai IS NOT NULL AND LTRIM(RTRIM(@soDienThoai)) <> '' AND so_dien_thoai = @soDienThoai)
      `,
      { email: email || null, soDienThoai: soDienThoai || null }
    );

    if (!taiKhoan) return apiFail(res, 404, "Khong tim thay tai khoan.");

    const otp = TaoOtp(6);
    const now = utcNowIso();
    const hetHanLuc = new Date(now.getTime() + 5 * 60 * 1000);

    const insertSql = `
      INSERT INTO ma_xac_thuc_otp (tai_khoan_id, email, so_dien_thoai, ma_otp, muc_dich, het_han_luc, da_su_dung, tao_luc)
      VALUES (@taiKhoanId, @email, @soDienThoai, @maOtp, 'QUEN_MAT_KHAU', @hetHanLuc, 0, @taoLuc)
    `;

    await exec(insertSql, {
      taiKhoanId: taiKhoan.tai_khoan_id,
      email: email || taiKhoan.email,
      soDienThoai: soDienThoai || taiKhoan.so_dien_thoai,
      maOtp: otp,
      hetHanLuc,
      taoLuc: now
    });

    return apiOk(res, {
      message: "Da tao OTP. (Ban dev: tra OTP de test Swagger)",
      otp,
      hetHanLuc
    });
  })
);

app.post(
  "/api/Auth/quen-mat-khau/dat-lai",
  asyncHandler(async (req, res) => {
    const request = req.body || {};
    const email = request.email ? String(request.email).trim() : "";
    const soDienThoai = request.soDienThoai ? String(request.soDienThoai).trim() : "";

    if (!email && !soDienThoai) return apiFail(res, 400, "Can nhap email hoac so dien thoai.");

    const otpCode = request.otp ? String(request.otp).trim() : "";
    const matKhauMoi = request.matKhauMoi ? String(request.matKhauMoi) : "";
    if (!otpCode) return apiFail(res, 400, "OTP khong hop le hoac da het han.");
    if (!matKhauMoi) return apiFail(res, 400, "Can nhap mat khau moi.");

    const now = utcNowIso();

    // giống .NET: filter QUEN_MAT_KHAU, ma_otp, !da_su_dung, het_han_luc >= now, và match email/sdt tương ứng
    const otpRow = await queryOne(
      `
        SELECT TOP 1 *
        FROM ma_xac_thuc_otp
        WHERE muc_dich = 'QUEN_MAT_KHAU'
          AND ma_otp = @otp
          AND da_su_dung = 0
          AND het_han_luc >= @now
          AND (
            (@email IS NOT NULL AND LTRIM(RTRIM(@email)) <> '' AND email = @email)
            OR
            (@soDienThoai IS NOT NULL AND LTRIM(RTRIM(@soDienThoai)) <> '' AND so_dien_thoai = @soDienThoai)
          )
        ORDER BY tao_luc DESC
      `,
      {
        otp: otpCode,
        now,
        email: email || null,
        soDienThoai: soDienThoai || null
      }
    );

    if (!otpRow) return apiFail(res, 400, "OTP khong hop le hoac da het han.");

    const taiKhoan = await queryOne(
      "SELECT TOP 1 * FROM tai_khoan WHERE tai_khoan_id = @taiKhoanId",
      { taiKhoanId: otpRow.tai_khoan_id }
    );
    if (!taiKhoan) return apiFail(res, 404, "Khong tim thay tai khoan.");

    const newHash = hashMatKhau(matKhauMoi);
    await exec(
      `
        UPDATE tai_khoan
        SET mat_khau_hash = @matKhauHash,
            cap_nhat_luc = @capNhatLuc
        WHERE tai_khoan_id = @taiKhoanId
      `,
      { matKhauHash: newHash, capNhatLuc: now, taiKhoanId: taiKhoan.tai_khoan_id }
    );

    await exec(
      `
        UPDATE ma_xac_thuc_otp
        SET da_su_dung = 1
        WHERE ma_xac_thuc_otp_id = @otpId
      `,
      { otpId: otpRow.ma_xac_thuc_otp_id }
    );

    return apiOk(res, "Dat lai mat khau thanh cong.");
  })
);

// --------------------- Upload (admin/nhan_vien) ---------------------
const MaxPosterBytes = 5 * 1024 * 1024;
const MaxTrailerBytes = 80 * 1024 * 1024;

const AllowedPosterExt = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
const AllowedTrailerExt = new Set([".mp4", ".webm", ".mov", ".mkv"]);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function storageForUpload(subDir) {
  return multer.diskStorage({
    destination: function destination(_req, _file, cb) {
      const dir = path.join(process.cwd(), "wwwroot", "uploads", subDir);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: function filename(_req, file, cb) {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const name = `${crypto.randomBytes(16).toString("hex")}${ext}`;
      cb(null, name);
    }
  });
}

function buildPublicUrl(req, relative) {
  // giống .NET: {scheme}://{host}/{relative}
  return `${req.protocol}://${req.get("host")}${relative.startsWith("/") ? relative : `/${relative}`}`;
}

const posterUpload = multer({
  storage: storageForUpload("posters"),
  limits: { fileSize: MaxPosterBytes }
});
const trailerUpload = multer({
  storage: storageForUpload("trailers"),
  limits: { fileSize: MaxTrailerBytes }
});

app.post(
  "/api/Upload/poster",
  requireAuth(["ADMIN", "NHAN_VIEN"]),
  posterUpload.single("file"),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file || file.size === 0) return apiFail(res, 400, "Chon file anh.");
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!AllowedPosterExt.has(ext)) {
      return apiFail(res, 400, "Chi chap nhan: jpg, jpeg, png, gif, webp.");
    }

    const publicUrl = buildPublicUrl(req, `/uploads/posters/${file.filename}`);
    return apiOk(res, { url: publicUrl });
  })
);

app.post(
  "/api/Upload/trailer",
  requireAuth(["ADMIN", "NHAN_VIEN"]),
  trailerUpload.single("file"),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file || file.size === 0) return apiFail(res, 400, "Chon file video.");
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!AllowedTrailerExt.has(ext)) {
      return apiFail(res, 400, "Chi chap nhan: mp4, webm, mov, mkv.");
    }

    const publicUrl = buildPublicUrl(req, `/uploads/trailers/${file.filename}`);
    return apiOk(res, { url: publicUrl });
  })
);

// --------------------- Phim (public list/details) ---------------------
app.get(
  "/api/Phim",
  asyncHandler(async (_req, res) => {
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
          poster_url AS posterUrl,
          trang_thai AS trangThai,
          tao_luc AS taoLuc,
          cap_nhat_luc AS capNhatLuc
        FROM phim
        ORDER BY tao_luc DESC
      `
    );
    return apiOk(res, rows);
  })
);

app.get(
  "/api/Phim/:id",
  asyncHandler(async (req, res) => {
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
          poster_url AS posterUrl,
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
  })
);

app.get(
  "/api/Phim/:phimId/gioi-thieu",
  asyncHandler(async (req, res) => {
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
  })
);

app.get(
  "/api/Phim/:phimId/trailer",
  asyncHandler(async (req, res) => {
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
  })
);

app.get(
  "/api/Phim/hot",
  asyncHandler(async (_req, res) => {
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
  })
);

// --------------------- SuatChieu (public list) ---------------------
app.get(
  "/api/SuatChieu",
  asyncHandler(async (req, res) => {
    const tuNgay = req.query.tuNgay ? new Date(req.query.tuNgay) : null;
    const denNgay = req.query.denNgay ? new Date(req.query.denNgay) : null;
    const phimId = req.query.phimId ? Number(req.query.phimId) : null;

    let whereSql = "";
    const params = {};
    if (tuNgay) {
      whereSql += " AND sc.thoi_gian_bat_dau >= @tuNgay";
      params.tuNgay = tuNgay;
    }
    if (denNgay) {
      whereSql += " AND sc.thoi_gian_bat_dau <= @denNgay";
      params.denNgay = denNgay;
    }
    if (phimId) {
      whereSql += " AND sc.phim_id = @phimId";
      params.phimId = phimId;
    }

    const rows = await queryAll(
      `
        SELECT
          sc.suat_chieu_id AS suatChieuId,
          sc.phim_id AS phimId,
          p.ten_phim AS tenPhim,
          sc.phong_chieu_id AS phongChieuId,
          pc.ten_phong AS tenPhong,
          sc.thoi_gian_bat_dau AS thoiGianBatDau,
          sc.thoi_gian_ket_thuc AS thoiGianKetThuc,
          sc.trang_thai AS trangThai
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
  })
);

// --------------------- GiaVe/phim (public) ---------------------
app.get(
  "/api/GiaVe/phim",
  asyncHandler(async (_req, res) => {
    const rows = await queryAll(
      `
        SELECT
          gia_ve_phim_id AS giaVePhimId,
          phim_id AS phimId,
          gia_co_ban AS giaCoBan,
          tu_ngay AS tuNgay,
          den_ngay AS denNgay
        FROM gia_ve_phim
        ORDER BY tu_ngay DESC
      `
    );
    return apiOk(res, rows);
  })
);

// --------------------- DatVe (public so-do-ghe/tao-don) ---------------------
async function tinhGiaVe({ phimId, phongChieuId, thoiGianBatDau }, { loaiGheId }, tx = null) {
  // giống .NET:
  // ngayChieu = DateOnly.FromDateTime(thoiGianBatDau)
  // gioChieu = TimeOnly.FromDateTime(thoiGianBatDau)
  const ngayChieu = thoiGianBatDau.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
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

app.get(
  "/api/DatVe/so-do-ghe/:suatChieuId",
  asyncHandler(async (req, res) => {
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
  })
);

app.post(
  "/api/DatVe/tao-don",
  asyncHandler(async (req, res) => {
    const request = req.body || {};
    const suatChieuId = Number(request.suatChieuId);
    const danhSachGheId = Array.isArray(request.danhSachGheId) ? request.danhSachGheId.map((x) => Number(x)) : [];
    const loaiVeId = Number(request.loaiVeId);
    const maCodeGiamGia = request.maCodeGiamGia ? String(request.maCodeGiamGia).trim() : "";
    const kenhDat = request.kenhDat ? String(request.kenhDat) : "";
    const taiKhoanId = request.taiKhoanId != null ? Number(request.taiKhoanId) : null;

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

    const phim = await queryOne("SELECT TOP 1 phim_id AS phimId FROM phim WHERE phim_id = @phimId", { phimId: suatChieu.phimId });
    if (!phim) return apiFail(res, 400, "Suat chieu chua gan phim hop le.");

    const loaiVe = await queryOne("SELECT TOP 1 loai_ve_id AS loaiVeId FROM loai_ve WHERE loai_ve_id = @loaiVeId", { loaiVeId });
    if (!loaiVe) return apiFail(res, 400, "Loai ve khong hop le.");

    // danh sách ghế phải thuộc đúng phòng chiếu
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

    // check ghế đã đặt
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
        tongGiam =
          ma.loaiGiam === "PHAN_TRAM" ? (tongTien * Number(ma.giaTriGiam)) / 100 : Number(ma.giaTriGiam);
        if (tongGiam > tongTien) tongGiam = tongTien;
      }
    }

    const tongThanhToan = tongTien - tongGiam;
    const maDon = formatMaDonLikeCSharp(now);

    let donDatVeId = null;
    const tx = new sql.Transaction(await getPool());
    await tx.begin();
    try {
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
            'CHO_THANH_TOAN',
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
          kenhDat: kenhDat ? kenhDat : "ONLINE",
          taoLuc: now
        },
        tx
      );

      donDatVeId = Number(donInsertRes?.donDatVeId);

      // insert ve
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
              NULL,
              0,
              'HOP_LE'
            )
          `,
          {
            donDatVeId,
            suatChieuId,
            gheId: item.gheId,
            loaiVeId,
            giaVe: item.giaVe
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

      await tx.commit();

      return apiOk(res, {
        donDatVeId,
        maDon,
        tongTienGoc: tongTien,
        tongGiam,
        tongThanhToan,
        danhSachVe: danhSachGia.map((x) => ({
          gheId: x.gheId,
          maGhe: x.maGhe,
          giaVe: x.giaVe
        }))
      });
    } catch (e) {
      await tx.rollback();
      // map lỗi giống .NET catch DbUpdateException
      return apiFail(res, 409, "Ghe vua duoc nguoi khac dat. Vui long dat lai.", { detail: String(e?.message || e) });
    }
  })
);

app.post(
  "/api/DatVe/thanh-toan",
  requireAuth([]),
  asyncHandler(async (req, res) => {
    const request = req.body || {};
    const donDatVeId = Number(request.donDatVeId);
    const phuongThucThanhToanId = Number(request.phuongThucThanhToanId);
    const maGiaoDich = request.maGiaoDich ? String(request.maGiaoDich).trim() : "";
    const now = utcNowIso();

    const don = await queryOne("SELECT TOP 1 * FROM don_dat_ve WHERE don_dat_ve_id = @donDatVeId", { donDatVeId });
    if (!don) return apiFail(res, 404, "Khong tim thay don dat ve.");
    if (don.trang_thai === "DA_THANH_TOAN") return apiFail(res, 400, "Don da thanh toan.");

    const pttt = await queryOne(
      "SELECT TOP 1 phuong_thuc_thanh_toan_id AS phuongThucThanhToanId FROM phuong_thuc_thanh_toan WHERE phuong_thuc_thanh_toan_id = @id",
      { id: phuongThucThanhToanId }
    );
    if (!pttt) return apiFail(res, 400, "Phuong thuc thanh toan khong hop le.");

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

      await exec(
        `UPDATE don_dat_ve SET trang_thai = 'DA_THANH_TOAN' WHERE don_dat_ve_id = @donDatVeId`,
        { donDatVeId },
        tx
      );

      const veRows = await queryAll(
        `
          SELECT ve_id AS veId
          FROM ve
          WHERE don_dat_ve_id = @donDatVeId
        `,
        { donDatVeId },
        tx
      );

      // Update từng ve để sinh QR giống .NET
      for (const vr of veRows) {
        const qr = `VE_${vr.veId}_${crypto.randomUUID().replace(/-/g, "")}`;
        await exec(
          `UPDATE ve SET ma_qr_ve = @qr WHERE ve_id = @veId`,
          { qr, veId: vr.veId },
          tx
        );
      }

      await tx.commit();

      // read lại danh sách qr
      const qrRows = await queryAll(
        `SELECT ma_qr_ve AS maQrVe FROM ve WHERE don_dat_ve_id = @donDatVeId`,
        { donDatVeId }
      );

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
  })
);

app.get(
  "/api/DatVe/don/:donDatVeId",
  asyncHandler(async (req, res) => {
    const donDatVeId = Number(req.params.donDatVeId);
    const don = await queryOne(
      "SELECT TOP 1 don_dat_ve_id AS donDatVeId, ma_don AS maDon, trang_thai AS trangThai, tong_tien_goc AS tongTienGoc, tong_giam AS tongGiam, tong_thanh_toan AS tongThanhToan FROM don_dat_ve WHERE don_dat_ve_id = @donDatVeId",
      { donDatVeId }
    );
    if (!don) return apiFail(res, 404, "Yeu cau khong hop le");

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
      donDatVeId: don.donDatVeId,
      maDon: don.maDon,
      trangThai: don.trangThai,
      tongTienGoc: don.tongTienGoc,
      tongGiam: don.tongGiam,
      tongThanhToan: don.tongThanhToan,
      danhSachVe: ve.map((x) => ({
        gheId: x.gheId,
        maGhe: x.maGhe,
        giaVe: x.giaVe,
        qrVe: x.qrVe
      }))
    });
  })
);

// --------------------- Phim (admin create) ---------------------
app.post(
  "/api/Phim",
  requireAuth(["ADMIN", "NHAN_VIEN"]),
  asyncHandler(async (req, res) => {
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
          poster_url,
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
          @posterUrl,
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
        posterUrl: request.posterUrl || null,
        trangThai,
        taoLuc: now,
        capNhatLuc: now
      }
    );

    const phimId = Number(insertRes?.phimId);
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
          poster_url AS posterUrl,
          trang_thai AS trangThai,
          tao_luc AS taoLuc,
          cap_nhat_luc AS capNhatLuc
        FROM phim
        WHERE phim_id = @phimId
      `,
      { phimId }
    );

    return apiOk(res, row, "Thanh cong", 201);
  })
);

app.post(
  "/api/Phim/:phimId/trailer",
  requireAuth(["ADMIN", "NHAN_VIEN"]),
  asyncHandler(async (req, res) => {
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
  })
);

// --------------------- SuatChieu (admin create) ---------------------
app.post(
  "/api/SuatChieu",
  requireAuth(["ADMIN", "NHAN_VIEN"]),
  asyncHandler(async (req, res) => {
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
          AND @start < thoi_gian_ket_thuc
          AND @end > thoi_gian_bat_dau
      `,
      { phongChieuId, start: thoiGianBatDau, end: thoiGianKetThuc }
    );
    if (biTrungLich) return apiFail(res, 409, "Phong chieu da co suat trung khung thoi gian.");

    const trangThai = request.trangThai && String(request.trangThai).trim() ? String(request.trangThai).trim() : "DANG_MO_BAN";

    const insertRes = await queryOne(
      `
        INSERT INTO suat_chieu (
          phim_id,
          phong_chieu_id,
          thoi_gian_bat_dau,
          thoi_gian_ket_thuc,
          trang_thai
        )
        OUTPUT INSERTED.suat_chieu_id AS suatChieuId
        VALUES (
          @phimId,
          @phongChieuId,
          @thoiGianBatDau,
          @thoiGianKetThuc,
          @trangThai
        )
      `,
      { phimId, phongChieuId, thoiGianBatDau, thoiGianKetThuc, trangThai }
    );

    const suatChieuId = Number(insertRes?.suatChieuId);
    const row = await queryOne(
      `
        SELECT
          suat_chieu_id AS suatChieuId,
          phim_id AS phimId,
          phong_chieu_id AS phongChieuId,
          thoi_gian_bat_dau AS thoiGianBatDau,
          thoi_gian_ket_thuc AS thoiGianKetThuc,
          trang_thai AS trangThai
        FROM suat_chieu
        WHERE suat_chieu_id = @suatChieuId
      `,
      { suatChieuId }
    );

    return apiOk(res, row);
  })
);

// --------------------- SuKien (public list) ---------------------
app.get(
  "/api/SuKien",
  asyncHandler(async (_req, res) => {
    const rows = await queryAll(
      `
        SELECT
          su_kien_id AS suKienId,
          tieu_de AS tieuDe,
          mo_ta_ngan AS moTaNgan,
          noi_dung AS noiDung,
          anh_dai_dien_url AS anhDaiDienUrl,
          hien_thi_trang_chu AS hienThiTrangChu,
          ngay_bat_dau AS ngayBatDau,
          ngay_ket_thuc AS ngayKetThuc,
          trang_thai AS trangThai,
          tao_luc AS taoLuc
        FROM su_kien
        ORDER BY tao_luc DESC
      `
    );
    return apiOk(res, rows);
  })
);

// --------------------- VanHanh (checkin-qr) ---------------------
app.post(
  "/api/VanHanh/checkin-qr",
  requireAuth(["ADMIN", "NHAN_VIEN"]),
  asyncHandler(async (req, res) => {
    const request = req.body || {};
    const maQrVe = request.maQrVe ? String(request.maQrVe).trim() : "";
    if (!maQrVe) return apiFail(res, 400, "Can nhap ma qr ve.");

    const ve = await queryOne(
      "SELECT TOP 1 ve_id AS veId, trang_thai AS trangThai, da_checkin AS daCheckin FROM ve WHERE ma_qr_ve = @maQrVe",
      { maQrVe }
    );
    if (!ve) return apiFail(res, 404, "Khong tim thay ve.");
    if (ve.trangThai !== "HOP_LE") return apiFail(res, 400, "Ve khong hop le.");
    if (Boolean(ve.daCheckin)) return apiFail(res, 400, "Ve da checkin truoc do.");

    const now = utcNowIso();
    await exec(
      "UPDATE ve SET da_checkin = 1, checkin_luc = @now WHERE ve_id = @veId",
      { now, veId: ve.veId }
    );

    return apiOk(res, {
      message: "Checkin thanh cong",
      veId: ve.veId,
      checkinLuc: now
    });
  })
);

// --------------------- Health: kiểm tra kết nối SQL ---------------------
app.get(
  "/api/health/db",
  asyncHandler(async (_req, res) => {
    const row = await queryOne("SELECT DB_NAME() AS dbName, @@VERSION AS version");
    return apiOk(res, { connected: true, dbName: row?.dbName, version: row?.version });
  })
);

app.get("/openapi.json", (_req, res) => res.json(openapiSpec));
app.use(
  "/swagger",
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    customSiteTitle: "QuanLyRapChieuPhim API",
    swaggerOptions: { persistAuthorization: true }
  })
);

// --------------------- Fallback for endpoints chưa convert ---------------------
app.use("/api", (req, res) => {
  apiFail(res, 501, "Chua chuyen xong endpoint trong Node.js: " + req.originalUrl);
});

app.get("/", (_req, res) => res.redirect(302, "/swagger/"));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Node Express BE running on http://localhost:${PORT}`);
});

