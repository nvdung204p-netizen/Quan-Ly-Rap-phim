const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const giaVeController = require("../controllers/giaVeController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.get("/phim", asyncHandler(giaVeController.listGiaVePhim));
router.get("/phim/:id", requireAuth(["ADMIN"]), asyncHandler(giaVeController.getGiaVePhim));
router.post("/phim", requireAuth(["ADMIN"]), asyncHandler(giaVeController.createGiaVePhim));
router.put("/phim/:id", requireAuth(["ADMIN"]), asyncHandler(giaVeController.updateGiaVePhim));
router.delete("/phim/:id", requireAuth(["ADMIN"]), asyncHandler(giaVeController.deleteGiaVePhim));

router.get("/loai-ghe", requireAuth(["ADMIN"]), asyncHandler(giaVeController.listLoaiGhe));
router.put("/loai-ghe/:id", requireAuth(["ADMIN"]), asyncHandler(giaVeController.updateLoaiGhe));

module.exports = router;
