const express = require("express");
const controller = require("../controllers/match.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

const router = express.Router();

router.get("/recommendations", requireAuth, requireRole("seeker"), controller.getMyRecommendations);
router.post("/refresh", requireAuth, requireRole("seeker"), controller.refreshMyRecommendations);

module.exports = router;
