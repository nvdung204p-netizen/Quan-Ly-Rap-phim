const express = require("express");
const router = express.Router();
const { asyncHandler } = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const ctrl = require("../controllers/thanhVienController");

// Public: Danh sách hạng thành viên
router.get("/hang", asyncHandler(ctrl.listHangThanhVien));

// Người dùng đã đăng nhập
router.get("/the-cua-toi", requireAuth([]), asyncHandler(ctrl.getMyThe));
router.post("/dang-ky", requireAuth([]), asyncHandler(ctrl.dangKyThe));

// Admin
router.get("/admin/danh-sach", requireAuth(["ADMIN"]), asyncHandler(ctrl.listTheThanhVien));
router.post("/admin/hang", requireAuth(["ADMIN"]), asyncHandler(ctrl.createHangThanhVien));
router.put("/admin/hang/:id", requireAuth(["ADMIN"]), asyncHandler(ctrl.updateHangThanhVien));

module.exports = router;
