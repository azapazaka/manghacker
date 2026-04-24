const path = require("path");
const db = require("../db/knex");
const { sendOfferDecisionToEmployer, sendOfferToSeeker, sendResumeToEmployer } = require("../services/telegram.service");

const OFFERABLE_STATUSES = new Set(["applied", "offer_sent", "accepted", "rejected"]);

async function applyToVacancy(req, res) {
  try {
    const { vacancy_id } = req.body;

    if (!vacancy_id) {
      return res.status(400).json({ message: "Не передан vacancy_id." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Загрузите PDF-резюме." });
    }

    const vacancy = await db("vacancies")
      .join("users as employers", "vacancies.employer_id", "employers.id")
      .where("vacancies.id", vacancy_id)
      .select(
        "vacancies.id",
        "vacancies.title",
        "vacancies.district",
        "vacancies.is_active",
        "employers.telegram_chat_id",
        db.raw("COALESCE(employers.company_name, employers.contact_name, employers.name) as employer_name")
      )
      .first();

    if (!vacancy || !vacancy.is_active) {
      return res.status(404).json({ message: "Активная вакансия не найдена." });
    }

    const duplicate = await db("applications").where({ vacancy_id, seeker_id: req.user.id }).first();
    if (duplicate) {
      return res.status(409).json({ message: "Вы уже откликались на эту вакансию." });
    }

    const resumePath = path.relative(process.cwd(), req.file.path).replaceAll("\\", "/");
    let tgStatus = "sent";
    let telegramDelivered = false;
    let telegramMessage = "Отклик отправлен, работодатель получил резюме в Telegram.";

    if (!vacancy.telegram_chat_id) {
      tgStatus = "failed";
      telegramMessage = "Отклик сохранен, но работодатель еще не активировал Telegram-бота.";
    }

    const [application] = await db("applications")
      .insert({
        vacancy_id,
        seeker_id: req.user.id,
        resume_path: resumePath,
        tg_status: tgStatus,
        status: "applied",
        updated_at: db.fn.now()
      })
      .returning("*");

    if (vacancy.telegram_chat_id) {
      try {
        await sendResumeToEmployer(vacancy.telegram_chat_id, req.file.path, {
          vacancyTitle: vacancy.title,
          seekerName: req.user.full_name || req.user.name,
          seekerEmail: req.user.email,
          seekerTelegram: req.user.telegram_username
        });
        telegramDelivered = true;
      } catch (error) {
        telegramMessage = "Отклик сохранен, но отправка в Telegram не удалась.";
        await db("applications").where({ id: application.id }).update({ tg_status: "failed" });
      }
    }

    return res.status(201).json({
      application_id: application.id,
      telegramDelivered,
      message: telegramMessage
    });
  } catch (error) {
    return res.status(500).json({ message: "Не удалось отправить отклик." });
  }
}

async function getMyApplications(req, res) {
  try {
    const applications = await db("applications")
      .join("vacancies", "applications.vacancy_id", "vacancies.id")
      .join("users as employers", "vacancies.employer_id", "employers.id")
      .where("applications.seeker_id", req.user.id)
      .select(
        "applications.id",
        "applications.status",
        "applications.tg_status",
        "applications.created_at",
        "vacancies.title as vacancy_title",
        "vacancies.district",
        "vacancies.category",
        "vacancies.employment_type",
        "vacancies.salary",
        db.raw("COALESCE(employers.company_name, employers.contact_name, employers.name) as employer_name")
      )
      .orderBy("applications.created_at", "desc");

    return res.json({ data: applications });
  } catch (error) {
    return res.status(500).json({ message: "Не удалось получить отклики." });
  }
}

async function getInboxOffers(req, res) {
  try {
    const offers = await db("applications")
      .join("vacancies", "applications.vacancy_id", "vacancies.id")
      .join("users as employers", "vacancies.employer_id", "employers.id")
      .where("applications.seeker_id", req.user.id)
      .whereIn("applications.status", ["offer_sent", "accepted", "rejected"])
      .select(
        "applications.id",
        "applications.status",
        "applications.offer_sent_at",
        "applications.decision_at",
        "vacancies.title as vacancy_title",
        "vacancies.district",
        "vacancies.category",
        "vacancies.employment_type",
        db.raw("COALESCE(employers.company_name, employers.contact_name, employers.name) as employer_name")
      )
      .orderBy("applications.offer_sent_at", "desc");

    return res.json({ data: offers });
  } catch (error) {
    return res.status(500).json({ message: "Не удалось получить входящие офферы." });
  }
}

async function sendOffer(req, res) {
  try {
    const application = await db("applications")
      .join("vacancies", "applications.vacancy_id", "vacancies.id")
      .join("users as seekers", "applications.seeker_id", "seekers.id")
      .join("users as employers", "vacancies.employer_id", "employers.id")
      .where("applications.id", req.params.id)
      .select(
        "applications.id",
        "applications.status",
        "applications.seeker_id",
        "vacancies.id as vacancy_id",
        "vacancies.title as vacancy_title",
        "vacancies.district",
        "employers.id as employer_id",
        "employers.telegram_chat_id as employer_chat_id",
        db.raw("COALESCE(employers.company_name, employers.contact_name, employers.name) as employer_name"),
        "seekers.telegram_chat_id as seeker_chat_id",
        "seekers.email as seeker_email",
        "seekers.telegram_username as seeker_telegram_username",
        db.raw("COALESCE(seekers.full_name, seekers.name) as seeker_name")
      )
      .first();

    if (!application || application.employer_id !== req.user.id) {
      return res.status(404).json({ message: "Кандидат по вакансии не найден." });
    }

    if (!OFFERABLE_STATUSES.has(application.status) || application.status === "accepted") {
      return res.status(409).json({ message: "Для этого отклика нельзя отправить оффер." });
    }

    if (!application.seeker_chat_id) {
      return res.status(409).json({ message: "Соискатель еще не активировал Telegram-бота через /start." });
    }

    await sendOfferToSeeker(application.seeker_chat_id, {
      vacancyTitle: application.vacancy_title,
      companyName: application.employer_name,
      district: application.district
    });

    const [updated] = await db("applications")
      .where({ id: req.params.id })
      .update({
        status: "offer_sent",
        offer_sent_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning("*");

    return res.json({
      data: updated,
      message: "Оффер отправлен соискателю в Telegram."
    });
  } catch (error) {
    console.error("sendOffer error", error);
    return res.status(500).json({ message: "Не удалось отправить оффер." });
  }
}

function createOfferDecisionHandler(decision) {
  return async function respondToOffer(req, res) {
    try {
      const application = await db("applications")
        .join("vacancies", "applications.vacancy_id", "vacancies.id")
        .join("users as employers", "vacancies.employer_id", "employers.id")
        .where("applications.id", req.params.id)
        .select(
          "applications.id",
          "applications.status",
          "applications.seeker_id",
          "vacancies.title as vacancy_title",
          "employers.telegram_chat_id as employer_chat_id",
          db.raw("COALESCE(employers.company_name, employers.contact_name, employers.name) as employer_name")
        )
        .first();

      if (!application || application.seeker_id !== req.user.id) {
        return res.status(404).json({ message: "Оффер не найден." });
      }

      if (application.status !== "offer_sent") {
        return res.status(409).json({ message: "Этот оффер уже обработан." });
      }

      const nextStatus = decision === "accepted" ? "accepted" : "rejected";

      const [updated] = await db("applications")
        .where({ id: req.params.id })
        .update({
          status: nextStatus,
          decision_at: db.fn.now(),
          updated_at: db.fn.now()
        })
        .returning("*");

      if (application.employer_chat_id) {
        await sendOfferDecisionToEmployer(application.employer_chat_id, {
          vacancyTitle: application.vacancy_title,
          seekerName: req.user.full_name || req.user.name,
          decision: nextStatus
        });
      }

      return res.json({
        data: updated,
        message: nextStatus === "accepted" ? "Вы приняли оффер." : "Вы отклонили оффер."
      });
    } catch (error) {
      console.error("respondToOffer error", error);
      return res.status(500).json({ message: "Не удалось обработать решение по офферу." });
    }
  };
}

module.exports = {
  applyToVacancy,
  getMyApplications,
  getInboxOffers,
  sendOffer,
  acceptOffer: createOfferDecisionHandler("accepted"),
  rejectOffer: createOfferDecisionHandler("rejected")
};
