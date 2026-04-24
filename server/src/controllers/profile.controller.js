const db = require("../db/knex");
const { sanitizeUser } = require("../utils/responses");
const { normalizeList } = require("../services/match.service");

function normalizeExperience(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
}

async function getMyProfile(req, res) {
  return res.json({ data: sanitizeUser(req.user) });
}

async function updateMyProfile(req, res) {
  try {
    if (req.user.role !== "seeker") {
      return res.status(403).json({ message: "AI-профиль доступен только соискателю." });
    }

    const patch = {
      skills: JSON.stringify(normalizeList(req.body.skills)),
      experience_years: normalizeExperience(req.body.experience_years),
      preferred_districts: JSON.stringify(normalizeList(req.body.preferred_districts)),
      preferred_employment_type: req.body.preferred_employment_type || null,
      profile_summary: (req.body.profile_summary || "").trim(),
      availability: (req.body.availability || "").trim(),
      profile_updated_at: db.fn.now()
    };

    const [updated] = await db("users")
      .where({ id: req.user.id })
      .update(patch)
      .returning([
        "id",
        "role",
        "name",
        "full_name",
        "contact_name",
        "company_name",
        "email",
        "telegram_username",
        "telegram_chat_id",
        "skills",
        "experience_years",
        "preferred_districts",
        "preferred_employment_type",
        "profile_summary",
        "availability",
        "profile_updated_at",
        "created_at"
      ]);

    return res.json({ data: sanitizeUser(updated), message: "AI-профиль обновлен." });
  } catch (error) {
    console.error("updateMyProfile error", error);
    return res.status(500).json({ message: "Не удалось сохранить AI-профиль." });
  }
}

module.exports = { getMyProfile, updateMyProfile };
