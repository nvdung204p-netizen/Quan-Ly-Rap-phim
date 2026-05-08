const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const { posterUpload, trailerUpload, qrPaymentUpload } = require("../middleware/uploadMulter");
const uploadController = require("../controllers/uploadController");

const router = express.Router();

router.post(
  "/poster",
  requireAuth(["ADMIN", "NHAN_VIEN"]),
  posterUpload.single("file"),
  asyncHandler(uploadController.uploadPoster)
);
router.post(
  "/trailer",
  requireAuth(["ADMIN", "NHAN_VIEN"]),
  trailerUpload.single("file"),
  asyncHandler(uploadController.uploadTrailer)
);
router.post(
  "/qr-thanh-toan",
  requireAuth(["ADMIN"]),
  qrPaymentUpload.single("file"),
  asyncHandler(uploadController.uploadQrThanhToan)
);

module.exports = router;
