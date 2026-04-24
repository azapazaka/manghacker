const express = require("express");
const controller = require("../controllers/application.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");
const upload = require("../utils/upload");

const router = express.Router();

router.post("/", requireAuth, requireRole("seeker"), upload.single("resume"), controller.applyToVacancy);
router.get("/my", requireAuth, requireRole("seeker"), controller.getMyApplications);
router.get("/offers", requireAuth, requireRole("seeker"), controller.getInboxOffers);
router.post("/:id/offer", requireAuth, requireRole("employer"), controller.sendOffer);
router.post("/:id/accept", requireAuth, requireRole("seeker"), controller.acceptOffer);
router.post("/:id/reject", requireAuth, requireRole("seeker"), controller.rejectOffer);

module.exports = router;
