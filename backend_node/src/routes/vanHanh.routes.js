const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const vanHanhController = require("../controllers/vanHanhController");

const router = express.Router();

router.post("/checkin-qr", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(vanHanhController.checkinQr));
router.get("/don-dat-ve", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(vanHanhController.searchDonDatVe));
router.get("/lich-su-checkin", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(vanHanhController.lichSuCheckin));

module.exports = router;
