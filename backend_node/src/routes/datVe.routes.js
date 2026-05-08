const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const datVeController = require("../controllers/datVeController");
const qrThanhToanController = require("../controllers/qrThanhToanController");

const router = express.Router();

router.get("/loai-ve", asyncHandler(datVeController.listLoaiVe));
router.get("/phuong-thuc-thanh-toan", asyncHandler(datVeController.listPhuongThucThanhToan));
router.get("/qr-thanh-toan", asyncHandler(qrThanhToanController.listPublic));
router.get("/so-do-ghe/:suatChieuId", asyncHandler(datVeController.soDoGhe));
router.post("/tao-don", requireAuth([]), asyncHandler(datVeController.taoDon));
router.post("/thanh-toan", requireAuth([]), asyncHandler(datVeController.thanhToan));
router.get("/lich-su", requireAuth([]), asyncHandler(datVeController.lichSuDatVe));
router.get("/don/:donDatVeId", requireAuth([]), asyncHandler(datVeController.getDon));
router.get("/don/:donDatVeId/chi-tiet-ve", requireAuth([]), asyncHandler(datVeController.chiTietVeDayDu));
router.post("/don/:donDatVeId/huy", requireAuth([]), asyncHandler(datVeController.huyDon));

module.exports = router;
