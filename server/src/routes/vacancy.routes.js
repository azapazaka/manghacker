const express = require("express");
const controller = require("../controllers/vacancy.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", controller.listVacancies);
router.get("/my", requireAuth, requireRole("employer"), controller.getMyVacancies);
router.get("/:id/candidates", requireAuth, requireRole("employer"), controller.getVacancyCandidates);
router.get("/:id/matches", requireAuth, requireRole("employer"), controller.getVacancyMatches);
router.get("/:id", controller.getVacancy);
router.post("/", requireAuth, requireRole("employer"), controller.createVacancy);
router.put("/:id", requireAuth, requireRole("employer"), controller.updateVacancy);
router.delete("/:id", requireAuth, requireRole("employer"), controller.deleteVacancy);

module.exports = router;
