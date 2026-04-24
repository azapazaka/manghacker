const express = require("express");
const controller = require("../controllers/profile.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/me", requireAuth, controller.getMyProfile);
router.put("/me", requireAuth, controller.updateMyProfile);
router.post("/parse-onboarding", requireAuth, controller.parseOnboarding);

module.exports = router;
