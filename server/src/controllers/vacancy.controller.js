const db = require("../db/knex");
const { getVacancyMatches: getAiVacancyMatches, refreshVacancyMatches } = require("../services/match.service");
const { normalizeList } = require("../services/match.service");
const env = require("../config/env");
const { sendInvitationToSeeker } = require("../services/telegram.service");

function baseVacancyQuery() {
  return db("vacancies").join("users as employers", "vacancies.employer_id", "employers.id");
}

function employerNameSelection() {
  return db.raw("COALESCE(employers.company_name, employers.contact_name, employers.name) as employer_name");
}

async function listVacancies(req, res) {
  try {
    const { category, employment_type, district, search } = req.query;

    const query = baseVacancyQuery()
      .where("vacancies.is_active", true)
      .select(
        "vacancies.id",
        "vacancies.title",
        "vacancies.description",
        "vacancies.requirements",
        "vacancies.employment_type",
        "vacancies.salary",
        "vacancies.district",
        "vacancies.category",
        "vacancies.ai_required_skills",
        "vacancies.ai_min_experience_years",
        "vacancies.microdistrict",
        "vacancies.schedule",
        "vacancies.ai_summary",
        "vacancies.is_active",
        "vacancies.created_at",
        "vacancies.updated_at",
        employerNameSelection()
      )
      .orderBy("vacancies.created_at", "desc");

    if (category) {
      query.whereILike("vacancies.category", `%${category}%`);
    }

    if (employment_type) {
      query.where("vacancies.employment_type", employment_type);
    }

    if (district) {
      query.whereILike("vacancies.district", `%${district}%`);
    }

    if (search) {
      query.andWhere((builder) => {
        builder
          .whereILike("vacancies.title", `%${search}%`)
          .orWhereILike("vacancies.description", `%${search}%`)
          .orWhereILike("vacancies.category", `%${search}%`)
          .orWhereILike("vacancies.district", `%${search}%`);
      });
    }

    const vacancies = await query;
    return res.json({ data: vacancies, total: vacancies.length });
  } catch (error) {
    return res.status(500).json({ message: "Не удалось получить список вакансий." });
  }
}

async function getVacancy(req, res) {
  try {
    const vacancy = await baseVacancyQuery()
      .where("vacancies.id", req.params.id)
      .select("vacancies.*", employerNameSelection(), "employers.telegram_chat_id as employer_telegram_chat_id")
      .first();

    if (!vacancy) {
      return res.status(404).json({ message: "Вакансия не найдена." });
    }

    return res.json({ data: vacancy });
  } catch (error) {
    return res.status(500).json({ message: "Не удалось получить вакансию." });
  }
}

async function createVacancy(req, res) {
  try {
    const { title, description, requirements, employment_type, salary, district, category } = req.body;

    if (!title || !description || !employment_type || !district || !category) {
      return res.status(400).json({ message: "Заполните обязательные поля вакансии." });
    }

    const [vacancy] = await db("vacancies")
      .insert({
        employer_id: req.user.id,
        title: title.trim(),
        description: description.trim(),
        requirements: (requirements || "").trim(),
        employment_type,
        salary: salary ? parseInt(salary, 10) : null,
        district: district.trim(),
        category: category.trim(),
        ai_required_skills: JSON.stringify(normalizeList(req.body.ai_required_skills)),
        ai_min_experience_years: req.body.ai_min_experience_years ? Number(req.body.ai_min_experience_years) : null,
        microdistrict: (req.body.microdistrict || "").trim(),
        schedule: (req.body.schedule || "").trim(),
        ai_summary: (req.body.ai_summary || "").trim()
      })
      .returning("*");

    return res.status(201).json({ data: vacancy });
  } catch (error) {
    return res.status(500).json({ message: "Не удалось создать вакансию." });
  }
}

async function updateVacancy(req, res) {
  try {
    const vacancy = await db("vacancies").where({ id: req.params.id }).first();

    if (!vacancy) {
      return res.status(404).json({ message: "Вакансия не найдена." });
    }

    if (vacancy.employer_id !== req.user.id) {
      return res.status(403).json({ message: "Можно редактировать только свои вакансии." });
    }

    const patch = {
      title: req.body.title?.trim(),
      description: req.body.description?.trim(),
      requirements: req.body.requirements?.trim(),
      employment_type: req.body.employment_type,
      salary: req.body.salary ? parseInt(req.body.salary, 10) : null,
      district: req.body.district?.trim(),
      category: req.body.category?.trim(),
      ai_required_skills: req.body.ai_required_skills === undefined ? undefined : JSON.stringify(normalizeList(req.body.ai_required_skills)),
      ai_min_experience_years: req.body.ai_min_experience_years === undefined ? undefined : req.body.ai_min_experience_years === "" ? null : Number(req.body.ai_min_experience_years),
      microdistrict: req.body.microdistrict?.trim(),
      schedule: req.body.schedule?.trim(),
      ai_summary: req.body.ai_summary?.trim(),
      is_active: typeof req.body.is_active === "boolean" ? req.body.is_active : vacancy.is_active,
      updated_at: db.fn.now()
    };

    Object.keys(patch).forEach((key) => patch[key] === undefined && delete patch[key]);

    const [updated] = await db("vacancies").where({ id: req.params.id }).update(patch).returning("*");
    return res.json({ data: updated });
  } catch (error) {
    return res.status(500).json({ message: "Не удалось обновить вакансию." });
  }
}

async function deleteVacancy(req, res) {
  try {
    const vacancy = await db("vacancies").where({ id: req.params.id }).first();

    if (!vacancy) {
      return res.status(404).json({ message: "Вакансия не найдена." });
    }

    if (vacancy.employer_id !== req.user.id) {
      return res.status(403).json({ message: "Можно закрывать только свои вакансии." });
    }

    const [updated] = await db("vacancies").where({ id: req.params.id }).update({ is_active: false, updated_at: db.fn.now() }).returning("*");

    return res.json({ data: updated, message: "Вакансия закрыта." });
  } catch (error) {
    return res.status(500).json({ message: "Не удалось закрыть вакансию." });
  }
}

async function getMyVacancies(req, res) {
  try {
    const vacancies = await db("vacancies").where({ employer_id: req.user.id }).orderBy("created_at", "desc");
    return res.json({ data: vacancies });
  } catch (error) {
    return res.status(500).json({ message: "Не удалось получить ваши вакансии." });
  }
}

async function getVacancyCandidates(req, res) {
  try {
    const vacancy = await db("vacancies").where({ id: req.params.id, employer_id: req.user.id }).first();

    if (!vacancy) {
      return res.status(404).json({ message: "Вакансия не найдена." });
    }

    const candidates = await db("applications")
      .join("users as seekers", "applications.seeker_id", "seekers.id")
      .where("applications.vacancy_id", req.params.id)
      .select(
        "applications.id",
        "applications.status",
        "applications.created_at",
        "applications.offer_sent_at",
        "applications.decision_at",
        "seekers.id as seeker_id",
        "seekers.email as seeker_email",
        "seekers.telegram_username as seeker_telegram_username",
        "seekers.skills",
        "seekers.experience_years",
        "seekers.preferred_districts",
        "seekers.preferred_employment_type",
        db.raw("COALESCE(seekers.full_name, seekers.name) as seeker_name")
      )
      .orderBy("applications.created_at", "desc");

    return res.json({ data: { vacancy, candidates } });
  } catch (error) {
    return res.status(500).json({ message: "Не удалось получить кандидатов по вакансии." });
  }
}

async function getVacancyMatches(req, res) {
  try {
    const result = await getAiVacancyMatches({
      employerId: req.user.id,
      vacancyId: req.params.id
    });

    if (!result) {
      return res.status(404).json({ message: "Вакансия не найдена." });
    }

    return res.json({ data: result });
  } catch (error) {
    console.error("getVacancyMatches error", error);
    return res.status(500).json({ message: "Не удалось получить AI-кандидатов." });
  }
}

async function refreshEmployerVacancyMatches(req, res) {
  try {
    const result = await refreshVacancyMatches({
      employerId: req.user.id,
      vacancyId: req.params.id
    });

    if (!result) {
      return res.status(404).json({ message: "Вакансия не найдена." });
    }

    return res.json({ data: result, message: "AI-подбор кандидатов обновлен." });
  } catch (error) {
    console.error("refreshEmployerVacancyMatches error", error);
    return res.status(500).json({ message: "Не удалось пересчитать AI-кандидатов." });
  }
}

async function inviteCandidate(req, res) {
  try {
    const vacancy = await db("vacancies")
      .join("users as employers", "vacancies.employer_id", "employers.id")
      .where("vacancies.id", req.params.id)
      .where("vacancies.employer_id", req.user.id)
      .select("vacancies.*", db.raw("COALESCE(employers.company_name, employers.contact_name, employers.name) as employer_name"))
      .first();

    if (!vacancy) {
      return res.status(404).json({ message: "Вакансия не найдена." });
    }

    const seeker = await db("users").where({ id: req.params.seekerId, role: "seeker" }).first();
    if (!seeker) {
      return res.status(404).json({ message: "Соискатель не найден." });
    }

    const application = await db("applications").where({ vacancy_id: vacancy.id, seeker_id: seeker.id }).first();
    if (application) {
      return res.status(409).json({ message: "Этот соискатель уже откликнулся на вакансию." });
    }

    const matchResult = await getAiVacancyMatches({ employerId: req.user.id, vacancyId: vacancy.id });
    const match = matchResult?.matches?.find((item) => item.seeker?.id === seeker.id);

    const [outreach] = await db("ai_candidate_outreach")
      .insert({
        vacancy_id: vacancy.id,
        seeker_id: seeker.id,
        status: "invited",
        sent_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .onConflict(["vacancy_id", "seeker_id"])
      .merge({
        status: "invited",
        sent_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning("*");

    let telegramDelivered = false;
    if (env.telegramBotToken && seeker.telegram_chat_id) {
      try {
        await sendInvitationToSeeker(seeker.telegram_chat_id, {
          vacancyTitle: vacancy.title,
          companyName: vacancy.employer_name,
          score: match?.score,
          message: match?.outreach_message
        });
        telegramDelivered = true;
      } catch (error) {
        console.warn("inviteCandidate telegram error", error.message);
      }
    }

    return res.json({
      data: {
        outreach,
        telegramDelivered
      },
      message: telegramDelivered ? "Приглашение отправлено в Telegram и сохранено в системе." : "Приглашение сохранено. Telegram пока не доставлен."
    });
  } catch (error) {
    console.error("inviteCandidate error", error);
    return res.status(500).json({ message: "Не удалось пригласить кандидата." });
  }
}

module.exports = {
  listVacancies,
  getVacancy,
  createVacancy,
  updateVacancy,
  deleteVacancy,
  getMyVacancies,
  getVacancyCandidates,
  getVacancyMatches,
  refreshEmployerVacancyMatches,
  inviteCandidate
};
