const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const suatChieuController = require("../controllers/suatChieuController");

const router = express.Router();

router.get("/", asyncHandler(suatChieuController.listSuatChieu));
router.post("/", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(suatChieuController.createSuatChieu));
router.put("/:suatChieuId", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(suatChieuController.updateSuatChieu));
router.delete("/:suatChieuId", requireAuth(["ADMIN", "NHAN_VIEN"]), asyncHandler(suatChieuController.deleteSuatChieu));

module.exports = router;
