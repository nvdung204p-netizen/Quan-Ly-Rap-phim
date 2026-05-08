const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const MaxPosterBytes = 5 * 1024 * 1024;
const MaxTrailerBytes = 80 * 1024 * 1024;

const AllowedPosterExt = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
const AllowedTrailerExt = new Set([".mp4", ".webm", ".mov", ".mkv"]);

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function storageForUpload(subDir) {
  return multer.diskStorage({
    destination(_req, _file, cb) {
      const dir = path.join(process.cwd(), "wwwroot", "uploads", subDir);
      ensureDir(dir);
      cb(null, dir);
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const name = `${crypto.randomBytes(16).toString("hex")}${ext}`;
      cb(null, name);
    }
  });
}

function buildPublicUrl(req, relative) {
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

const qrPaymentUpload = multer({
  storage: storageForUpload("qr-thanh-toan"),
  limits: { fileSize: MaxPosterBytes }
});

module.exports = {
  posterUpload,
  trailerUpload,
  qrPaymentUpload,
  buildPublicUrl,
  AllowedPosterExt,
  AllowedTrailerExt
};
