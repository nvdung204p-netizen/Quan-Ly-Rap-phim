const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/dang-ky", asyncHandler(authController.dangKy));
router.post("/dang-nhap", asyncHandler(authController.dangNhap));
router.post("/quen-mat-khau/gui-otp", asyncHandler(authController.quenMatKhauGuiOtp));
router.post("/quen-mat-khau/dat-lai", asyncHandler(authController.quenMatKhauDatLai));

module.exports = router;
