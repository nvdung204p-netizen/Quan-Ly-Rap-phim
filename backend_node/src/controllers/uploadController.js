const path = require("path");
const { apiOk, apiFail } = require("../utils/apiResponse");
const { buildPublicUrl, AllowedPosterExt, AllowedTrailerExt } = require("../middleware/uploadMulter");

async function uploadPoster(req, res) {
  const file = req.file;
  if (!file || file.size === 0) return apiFail(res, 400, "Chon file anh.");
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!AllowedPosterExt.has(ext)) {
    return apiFail(res, 400, "Chi chap nhan: jpg, jpeg, png, gif, webp.");
  }

  const publicUrl = buildPublicUrl(req, `/uploads/posters/${file.filename}`);
  return apiOk(res, { url: publicUrl });
}

async function uploadTrailer(req, res) {
  const file = req.file;
  if (!file || file.size === 0) return apiFail(res, 400, "Chon file video.");
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!AllowedTrailerExt.has(ext)) {
    return apiFail(res, 400, "Chi chap nhan: mp4, webm, mov, mkv.");
  }

  const publicUrl = buildPublicUrl(req, `/uploads/trailers/${file.filename}`);
  return apiOk(res, { url: publicUrl });
}

async function uploadQrThanhToan(req, res) {
  const file = req.file;
  if (!file || file.size === 0) return apiFail(res, 400, "Chon file anh.");
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!AllowedPosterExt.has(ext)) {
    return apiFail(res, 400, "Chi chap nhan: jpg, jpeg, png, gif, webp.");
  }

  const publicUrl = buildPublicUrl(req, `/uploads/qr-thanh-toan/${file.filename}`);
  return apiOk(res, { url: publicUrl });
}

module.exports = { uploadPoster, uploadTrailer, uploadQrThanhToan };
