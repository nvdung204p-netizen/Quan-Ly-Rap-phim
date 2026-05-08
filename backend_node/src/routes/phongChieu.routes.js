const express = require("express");
const router = express.Router();

const phongChieuController = require("../controllers/phongChieuController");
const { asyncHandler } = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");

router.get("/", requireAuth(["ADMIN"]), asyncHandler(phongChieuController.listPhongChieu));
router.post("/", requireAuth(["ADMIN"]), asyncHandler(phongChieuController.createPhongChieu));
router.get("/:id", requireAuth(["ADMIN"]), asyncHandler(phongChieuController.getPhongChieu));
router.put("/:id", requireAuth(["ADMIN"]), asyncHandler(phongChieuController.updatePhongChieu));
router.get("/:id/ghe", requireAuth(["ADMIN"]), asyncHandler(phongChieuController.listGheTheoPhong));
router.patch("/:id/ghe/:gheId", requireAuth(["ADMIN"]), asyncHandler(phongChieuController.updateLoaiGhe));
router.post("/:id/ghe/bulk-update", requireAuth(["ADMIN"]), asyncHandler(phongChieuController.bulkUpdateLoaiGhe));

module.exports = router;

