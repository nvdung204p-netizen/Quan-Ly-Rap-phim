const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const suKienController = require("../controllers/suKienController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", asyncHandler(suKienController.listSuKien));
router.get("/:id", asyncHandler(suKienController.getSuKienById));
router.post("/", requireAuth(["ADMIN"]), asyncHandler(suKienController.createSuKien));
router.put("/:id", requireAuth(["ADMIN"]), asyncHandler(suKienController.updateSuKien));
router.delete("/:id", requireAuth(["ADMIN"]), asyncHandler(suKienController.deleteSuKien));

module.exports = router;
