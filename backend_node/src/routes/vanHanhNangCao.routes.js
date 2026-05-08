const express = require("express");
const router = express.Router();

const giamGiaController = require("../controllers/giamGiaController");
const thanhVienController = require("../controllers/thanhVienController");
const nganHangController = require("../controllers/nganHangController");
const hoTroController = require("../controllers/hoTroController");

const { asyncHandler } = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");

// Giảm giá
router.get("/giam-gia", asyncHandler(giamGiaController.listGiamGia));
router.post("/giam-gia", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(giamGiaController.createGiamGia));
router.put("/giam-gia/:id", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(giamGiaController.updateGiamGia));
router.delete("/giam-gia/:id", requireAuth(["ADMIN"]), asyncHandler(giamGiaController.deleteGiamGia));

// Hạng thành viên & thẻ
router.get("/hang-thanh-vien", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(thanhVienController.listHangThanhVien));
router.post("/hang-thanh-vien", requireAuth(["ADMIN"]), asyncHandler(thanhVienController.createHangThanhVien));
router.put("/hang-thanh-vien/:id", requireAuth(["ADMIN"]), asyncHandler(thanhVienController.updateHangThanhVien));
router.get("/the-thanh-vien", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(thanhVienController.listTheThanhVien));

// Ngân hàng
router.get("/ngan-hang", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(nganHangController.listNganHang));
router.post("/ngan-hang", requireAuth(["ADMIN"]), asyncHandler(nganHangController.createNganHang));
router.put("/ngan-hang/:id", requireAuth(["ADMIN"]), asyncHandler(nganHangController.updateNganHang));
router.delete("/ngan-hang/:id", requireAuth(["ADMIN"]), asyncHandler(nganHangController.deleteNganHang));

// Kênh hỗ trợ
router.get("/ho-tro", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(hoTroController.listKenhHoTro));
router.post("/ho-tro", requireAuth(["ADMIN"]), asyncHandler(hoTroController.createKenhHoTro));
router.put("/ho-tro/:id", requireAuth(["ADMIN"]), asyncHandler(hoTroController.updateKenhHoTro));
router.delete("/ho-tro/:id", requireAuth(["ADMIN"]), asyncHandler(hoTroController.deleteKenhHoTro));

module.exports = router;
