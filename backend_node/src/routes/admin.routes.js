const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const adminController = require("../controllers/adminController");
const qrThanhToanController = require("../controllers/qrThanhToanController");
const baoCaoController = require("../controllers/adminBaoCaoController");

const router = express.Router();

router.get("/tai-khoan", requireAuth(["ADMIN"]), asyncHandler(adminController.listTaiKhoan));
router.post("/tai-khoan/nhan-vien", requireAuth(["ADMIN"]), asyncHandler(adminController.createNhanVien));
router.patch(
  "/tai-khoan/:taiKhoanId/trang-thai",
  requireAuth(["ADMIN"]),
  asyncHandler(adminController.patchTrangThai)
);

router.get("/qr-thanh-toan", requireAuth(["ADMIN"]), asyncHandler(qrThanhToanController.listAdmin));
router.post("/qr-thanh-toan", requireAuth(["ADMIN"]), asyncHandler(qrThanhToanController.createQr));
router.put("/qr-thanh-toan/:qrThanhToanId", requireAuth(["ADMIN"]), asyncHandler(qrThanhToanController.updateQr));
router.delete("/qr-thanh-toan/:qrThanhToanId", requireAuth(["ADMIN"]), asyncHandler(qrThanhToanController.deleteQr));

// Báo cáo thống kê
router.get("/bao-cao/tong-quan", requireAuth(["ADMIN"]), asyncHandler(baoCaoController.tongQuan));
router.get("/bao-cao/doanh-thu-theo-ngay", requireAuth(["ADMIN"]), asyncHandler(baoCaoController.doanhThuTheoNgay));
router.get("/bao-cao/doanh-thu-theo-phim", requireAuth(["ADMIN"]), asyncHandler(baoCaoController.doanhThuTheoPhim));
router.get("/bao-cao/don-hang-gan-day", requireAuth(["ADMIN"]), asyncHandler(baoCaoController.donHangGanDay));
router.get("/bao-cao/phong-chieu", requireAuth(["ADMIN"]), asyncHandler(baoCaoController.thongKePhongChieu));

module.exports = router;

