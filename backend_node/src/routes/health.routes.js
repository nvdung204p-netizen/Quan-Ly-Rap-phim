const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const healthController = require("../controllers/healthController");

const router = express.Router();

router.get("/db", asyncHandler(healthController.dbHealth));

module.exports = router;
