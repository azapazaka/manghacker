const db = require("../db/knex");

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
        salary: salary ? Number(salary) : null,
        district: district.trim(),
        category: category.trim()
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
      salary: req.body.salary ? Number(req.body.salary) : null,
      district: req.body.district?.trim(),
      category: req.body.category?.trim(),
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
        db.raw("COALESCE(seekers.full_name, seekers.name) as seeker_name")
      )
      .orderBy("applications.created_at", "desc");

    return res.json({ data: { vacancy, candidates } });
  } catch (error) {
    return res.status(500).json({ message: "Не удалось получить кандидатов по вакансии." });
  }
}

module.exports = {
  listVacancies,
  getVacancy,
  createVacancy,
  updateVacancy,
  deleteVacancy,
  getMyVacancies,
  getVacancyCandidates
};
