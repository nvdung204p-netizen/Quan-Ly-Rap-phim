const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const phimController = require("../controllers/phimController");

const router = express.Router();

router.get("/", asyncHandler(phimController.listPhim));
router.get("/hot", asyncHandler(phimController.listPhimHot));
router.get("/:id", asyncHandler(phimController.getPhimById));
router.get("/:phimId/gioi-thieu", asyncHandler(phimController.listGioiThieu));
router.get("/:phimId/trailer", asyncHandler(phimController.listTrailer));

router.post("/", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(phimController.createPhim));
router.put("/:phimId", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(phimController.updatePhim));
router.delete("/:phimId", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(phimController.deletePhim));

// Trailer
router.post("/:phimId/trailer", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(phimController.createTrailerPhim));
router.delete("/trailer/:id", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(phimController.deleteTrailerPhim));

// Giới thiệu
router.post("/:phimId/gioi-thieu", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(phimController.createGioiThieu));
router.put("/gioi-thieu/:id", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(phimController.updateGioiThieu));
router.delete("/gioi-thieu/:id", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(phimController.deleteGioiThieu));

// Phim hot
router.post("/hot", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(phimController.createPhimHot));
router.delete("/hot/:id", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(phimController.deletePhimHot));

module.exports = router;
