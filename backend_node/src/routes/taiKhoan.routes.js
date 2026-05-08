const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const { requireAuth } = require("../middleware/requireAuth");
const taiKhoanController = require("../controllers/taiKhoanController");

const router = express.Router();

router.get("/ho-so", requireAuth([]), asyncHandler(taiKhoanController.getHoSo));
router.put("/ho-so", requireAuth([]), asyncHandler(taiKhoanController.putHoSo));

module.exports = router;
