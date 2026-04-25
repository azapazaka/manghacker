const crypto = require("crypto");
const db = require("../db/knex");
const env = require("../config/env");
const { getProviderConfig, requestMatchAnalysis, sanitizeLlmError } = require("./llm.service");

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeText).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,;\n]/)
      .map(normalizeText)
      .filter(Boolean);
  }

  return [];
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function verdictFromScore(score) {
  if (score >= 85) return "strong";
  if (score >= 65) return "good";
  if (score >= 40) return "weak";
  return "not_fit";
}

function computeFallbackMatch({ seeker, vacancy }) {
  const seekerSkills = normalizeList(seeker?.skills);
  const requiredSkills = normalizeList(vacancy?.ai_required_skills);
  const preferredDistricts = normalizeList(seeker?.preferred_districts);
  const prefersWholeCity = !preferredDistricts.length && ["city", "nearby"].includes(normalizeText(seeker?.availability));
  const vacancyDistrict = normalizeText(vacancy?.microdistrict || vacancy?.district);
  const seekerEmploymentType = normalizeText(seeker?.preferred_employment_type);
  const vacancyEmploymentType = normalizeText(vacancy?.employment_type);
  const seekerExperience = Number(seeker?.experience_years);
  const minExperience = Number(vacancy?.ai_min_experience_years || 0);

  const matchedSkills = requiredSkills.filter((skill) => seekerSkills.includes(skill));
  const missingSkills = requiredSkills.filter((skill) => !seekerSkills.includes(skill));
  const skillRatio = requiredSkills.length ? matchedSkills.length / requiredSkills.length : seekerSkills.length ? 0.8 : 0;
  const districtMatches = prefersWholeCity || (vacancyDistrict && preferredDistricts.some((district) => vacancyDistrict.includes(district) || district.includes(vacancyDistrict)));
  const employmentMatches = seekerEmploymentType && vacancyEmploymentType && seekerEmploymentType === vacancyEmploymentType;
  const experienceMatches = Number.isFinite(seekerExperience) && seekerExperience >= minExperience;

  let score = skillRatio * 45;
  if (districtMatches) score += 20;
  if (employmentMatches) score += 15;
  if (experienceMatches) score += 10;
  if (seekerSkills.length && preferredDistricts.length && seekerEmploymentType) score += 10;

  const normalizedScore = clampScore(score);
  const reasons = [];
  const risks = [];
  const improvementTips = [];

  if (matchedSkills.length) reasons.push(`Совпали навыки: ${matchedSkills.join(", ")}.`);
  if (districtMatches) reasons.push("Локация совпадает с предпочтениями соискателя.");
  if (employmentMatches) reasons.push("Формат занятости совпадает.");
  if (experienceMatches) reasons.push("Опыт закрывает минимальное требование.");

  if (missingSkills.length) risks.push(`Не хватает навыков: ${missingSkills.join(", ")}.`);
  if (!districtMatches && preferredDistricts.length) risks.push("Локация не подтверждена в предпочтениях соискателя.");
  if (!employmentMatches) risks.push("Формат занятости может не совпадать.");
  if (!experienceMatches && minExperience > 0) risks.push("Опыт ниже или не указан относительно требования.");

  if (!seekerSkills.length) improvementTips.push("Добавьте навыки в профиль, чтобы AI смог точнее подобрать вакансии.");
  if (!preferredDistricts.length && !prefersWholeCity) improvementTips.push("Укажите желаемые районы или микрорайоны.");
  if (!seekerEmploymentType) improvementTips.push("Выберите желаемый формат занятости.");
  if (!Number.isFinite(seekerExperience)) improvementTips.push("Укажите опыт работы в годах.");
  if (missingSkills.length) improvementTips.push(`Подтяните или явно укажите опыт по навыкам: ${missingSkills.join(", ")}.`);

  const confidence = clampScore(20 + Math.min(35, seekerSkills.length * 10) + (preferredDistricts.length ? 15 : 0) + (seekerEmploymentType ? 15 : 0) + (Number.isFinite(seekerExperience) ? 15 : 0));

  return {
    source: "fallback",
    score: normalizedScore,
    verdict: verdictFromScore(normalizedScore),
    summary: reasons[0] || "Данных пока мало, поэтому оценка построена по базовым совпадениям профиля и вакансии.",
    reasons,
    risks,
    improvement_tips: improvementTips,
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    confidence
  };
}

function buildEmployerInsights(analysis, { seeker, vacancy }) {
  const candidateName = seeker?.full_name || seeker?.name || "Кандидат";
  const vacancyTitle = vacancy?.title || "эта вакансия";
  const matchedSkills = Array.isArray(analysis.matched_skills) ? analysis.matched_skills : [];
  const missingSkills = Array.isArray(analysis.missing_skills) ? analysis.missing_skills : [];

  return {
    ...analysis,
    employer_summary:
      analysis.employer_summary ||
      (analysis.score >= 75
        ? `${candidateName} выглядит сильным кандидатом на ${vacancyTitle}. ${analysis.summary}`
        : `${candidateName} можно рассмотреть на ${vacancyTitle}, но стоит уточнить ключевые требования на первом контакте.`),
    interview_focus:
      Array.isArray(analysis.interview_focus) && analysis.interview_focus.length
        ? analysis.interview_focus
        : [
            matchedSkills.length ? `Уточнить реальный опыт по навыкам: ${matchedSkills.slice(0, 3).join(", ")}.` : "Уточнить релевантный опыт по вакансии.",
            missingSkills.length ? `Проверить пробелы по навыкам: ${missingSkills.slice(0, 3).join(", ")}.` : "Проверить комфорт по графику и формату занятости.",
            "Подтвердить локацию и готовность быстро выйти на работу."
          ].filter(Boolean),
    outreach_message:
      analysis.outreach_message ||
      `Здравствуйте! У нас есть вакансия "${vacancyTitle}". Ваш профиль выглядит релевантным, будем рады вашему отклику в Qoldan.`
  };
}

function createInputHash(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function safeJsonArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return normalizeList(value);
    }
  }

  return [];
}

function serializeMatch(row) {
  if (!row) return null;

  return {
    ...row,
    reasons: safeJsonArray(row.reasons),
    risks: safeJsonArray(row.risks),
    improvement_tips: safeJsonArray(row.improvement_tips),
    matched_skills: safeJsonArray(row.matched_skills),
    missing_skills: safeJsonArray(row.missing_skills),
    interview_focus: safeJsonArray(row.interview_focus),
    skills: safeJsonArray(row.skills),
    preferred_districts: safeJsonArray(row.preferred_districts),
    ai_required_skills: safeJsonArray(row.ai_required_skills),
    employer_summary: row.employer_summary || "",
    outreach_message: row.outreach_message || ""
  };
}

function buildMatchPayload({ seeker, vacancy }) {
  return {
    seeker: {
      id: seeker.id,
      name: seeker.full_name || seeker.name,
      skills: safeJsonArray(seeker.skills),
      experience_years: seeker.experience_years,
      preferred_districts: safeJsonArray(seeker.preferred_districts),
      preferred_employment_type: seeker.preferred_employment_type,
      profile_summary: seeker.profile_summary || "",
      availability: seeker.availability || ""
    },
    vacancy: {
      id: vacancy.id,
      title: vacancy.title,
      category: vacancy.category,
      description: vacancy.description,
      requirements: vacancy.requirements,
      employment_type: vacancy.employment_type,
      district: vacancy.district,
      microdistrict: vacancy.microdistrict,
      schedule: vacancy.schedule,
      ai_required_skills: safeJsonArray(vacancy.ai_required_skills),
      ai_min_experience_years: vacancy.ai_min_experience_years,
      ai_summary: vacancy.ai_summary || ""
    }
  };
}

async function saveMatchResult({ seekerId, vacancyId, inputHash, analysis }) {
  const row = {
    seeker_id: seekerId,
    vacancy_id: vacancyId,
    score: analysis.score,
    verdict: analysis.verdict,
    summary: analysis.summary || "",
    reasons: JSON.stringify(analysis.reasons || []),
    risks: JSON.stringify(analysis.risks || []),
    improvement_tips: JSON.stringify(analysis.improvement_tips || []),
    matched_skills: JSON.stringify(analysis.matched_skills || []),
    missing_skills: JSON.stringify(analysis.missing_skills || []),
    employer_summary: analysis.employer_summary || "",
    interview_focus: JSON.stringify(analysis.interview_focus || []),
    outreach_message: analysis.outreach_message || "",
    confidence: analysis.confidence || 0,
    source: analysis.source || "fallback",
    provider: analysis.provider || null,
    model: analysis.model || null,
    input_hash: inputHash,
    updated_at: db.fn.now()
  };

  const [saved] = await db("ai_match_results")
    .insert(row)
    .onConflict(["seeker_id", "vacancy_id"])
    .merge(row)
    .returning("*");

  return serializeMatch(saved);
}

function isFreshCache(match, inputHash) {
  if (!match || match.input_hash !== inputHash) return false;

  const updatedAt = new Date(match.updated_at || match.created_at).getTime();
  const ttlMs = env.aiMatchCacheTtlHours * 60 * 60 * 1000;
  return Number.isFinite(updatedAt) && Date.now() - updatedAt < ttlMs;
}

function createLlmFallbackLogEntry({ providerConfig, audience, payload, error }) {
  return {
    event: "llm_match_fallback",
    provider: providerConfig.provider,
    model: providerConfig.model,
    audience,
    seeker_id: payload?.seeker?.id,
    vacancy_id: payload?.vacancy?.id,
    reason: sanitizeLlmError(error)
  };
}

async function analyzeAndCacheMatch({ seeker, vacancy, audience = "seeker", force = false }) {
  const payload = buildMatchPayload({ seeker, vacancy });
  const inputHash = createInputHash(payload);

  if (!force) {
    const cached = await db("ai_match_results").where({ seeker_id: seeker.id, vacancy_id: vacancy.id }).first();
    if (isFreshCache(cached, inputHash)) {
      return serializeMatch(cached);
    }
  }

  let analysis;
  try {
    analysis = await requestMatchAnalysis({ payload, audience });
  } catch (error) {
    console.warn("[qoldan-ai]", JSON.stringify(createLlmFallbackLogEntry({ providerConfig: getProviderConfig(), audience, payload, error })));
    analysis = computeFallbackMatch(payload);
  }

  if (audience === "employer") {
    analysis = buildEmployerInsights(analysis, { seeker, vacancy });
  }

  return saveMatchResult({
    seekerId: seeker.id,
    vacancyId: vacancy.id,
    inputHash,
    analysis
  });
}

async function refreshRecommendations(seekerId, { force = false } = {}) {
  const seeker = await db("users").where({ id: seekerId, role: "seeker" }).first();
  if (!seeker) {
    return [];
  }

  const vacancies = await db("vacancies")
    .join("users as employers", "vacancies.employer_id", "employers.id")
    .where("vacancies.is_active", true)
    .select("vacancies.*", db.raw("COALESCE(employers.company_name, employers.contact_name, employers.name) as employer_name"))
    .orderBy("vacancies.created_at", "desc")
    .limit(12);

  const matches = [];
  for (const vacancy of vacancies) {
    matches.push(await analyzeAndCacheMatch({ seeker, vacancy, audience: "seeker", force }));
  }

  return matches.sort((a, b) => b.score - a.score);
}

async function getRecommendations(seekerId) {
  const matches = await refreshRecommendations(seekerId, { force: false });
  if (!matches.length) return [];

  const vacancyIds = matches.map((match) => match.vacancy_id);
  const vacancies = await db("vacancies")
    .join("users as employers", "vacancies.employer_id", "employers.id")
    .whereIn("vacancies.id", vacancyIds)
    .select("vacancies.*", db.raw("COALESCE(employers.company_name, employers.contact_name, employers.name) as employer_name"));

  const vacancyById = new Map(vacancies.map((vacancy) => [vacancy.id, serializeMatch(vacancy)]));

  return matches
    .map((match) => ({
      ...match,
      vacancy: vacancyById.get(match.vacancy_id)
    }))
    .filter((match) => match.vacancy)
    .sort((a, b) => b.score - a.score);
}

async function getVacancyMatches({ employerId, vacancyId }) {
  const vacancy = await db("vacancies").where({ id: vacancyId, employer_id: employerId }).first();
  if (!vacancy) {
    return null;
  }

  const applicantRows = await db("applications").where({ vacancy_id: vacancyId }).select("seeker_id");
  const appliedSeekerIds = applicantRows.map((row) => row.seeker_id);
  const outreachRows = await db("ai_candidate_outreach").where({ vacancy_id: vacancyId }).select("*");
  const outreachBySeekerId = new Map(outreachRows.map((row) => [row.seeker_id, row]));
  const seekersQuery = db("users").where({ role: "seeker" }).orderBy("created_at", "desc").limit(20);

  if (appliedSeekerIds.length) {
    seekersQuery.whereNotIn("id", appliedSeekerIds);
  }

  const seekers = await seekersQuery;
  const matches = [];

  for (const seeker of seekers) {
    const match = await analyzeAndCacheMatch({ seeker, vacancy, audience: "employer", force: false });
    const outreach = outreachBySeekerId.get(seeker.id);
    matches.push({
      ...match,
      status: outreach?.status || "new",
      seeker: {
        id: seeker.id,
        name: seeker.full_name || seeker.name,
        email: seeker.email,
        telegram_username: seeker.telegram_username,
        skills: safeJsonArray(seeker.skills),
        experience_years: seeker.experience_years,
        preferred_districts: safeJsonArray(seeker.preferred_districts),
        preferred_employment_type: seeker.preferred_employment_type,
        profile_summary: seeker.profile_summary || ""
      }
    });
  }

  return {
    vacancy: serializeMatch(vacancy),
    matches: matches.sort((a, b) => b.score - a.score)
  };
}

async function refreshVacancyMatches({ employerId, vacancyId }) {
  const vacancy = await db("vacancies").where({ id: vacancyId, employer_id: employerId }).first();
  if (!vacancy) {
    return null;
  }

  const applicantRows = await db("applications").where({ vacancy_id: vacancyId }).select("seeker_id");
  const appliedSeekerIds = applicantRows.map((row) => row.seeker_id);
  const seekersQuery = db("users").where({ role: "seeker" }).orderBy("created_at", "desc").limit(20);

  if (appliedSeekerIds.length) {
    seekersQuery.whereNotIn("id", appliedSeekerIds);
  }

  const seekers = await seekersQuery;
  for (const seeker of seekers) {
    await analyzeAndCacheMatch({ seeker, vacancy, audience: "employer", force: true });
  }

  return getVacancyMatches({ employerId, vacancyId });
}

module.exports = {
  buildEmployerInsights,
  computeFallbackMatch,
  createLlmFallbackLogEntry,
  createInputHash,
  getRecommendations,
  getVacancyMatches,
  refreshVacancyMatches,
  normalizeList,
  refreshRecommendations,
  safeJsonArray,
  serializeMatch,
  verdictFromScore
};
