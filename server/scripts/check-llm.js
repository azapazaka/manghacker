const { getProviderConfig, requestMatchAnalysis, sanitizeLlmError } = require("../src/services/llm.service");

const payload = {
  seeker: {
    id: "health-seeker",
    name: "Тестовый соискатель",
    skills: ["продажи", "касса", "telegram"],
    experience_years: 1,
    preferred_districts: ["Актау"],
    preferred_employment_type: "part_time",
    profile_summary: "Ищу подработку в Актау, есть опыт продаж и работы с кассой.",
    availability: "вечер, выходные"
  },
  vacancy: {
    id: "health-vacancy",
    title: "Продавец-консультант",
    category: "retail",
    description: "Помощь покупателям, работа с кассой, выкладка товара.",
    requirements: "Опыт продаж желателен, ответственность, знание кассы.",
    employment_type: "part_time",
    district: "Актау",
    microdistrict: "12 микрорайон",
    schedule: "вечерние смены",
    ai_required_skills: ["продажи", "касса", "ответственность"],
    ai_min_experience_years: 1,
    ai_summary: "Подработка в рознице для кандидата с опытом продаж."
  }
};

async function main() {
  const providerConfig = getProviderConfig();

  console.log(JSON.stringify({
    event: "llm_check_started",
    provider: providerConfig.provider,
    model: providerConfig.model,
    hasApiKey: Boolean(providerConfig.apiKey)
  }, null, 2));

  const result = await requestMatchAnalysis({ payload, audience: "seeker" });

  console.log(JSON.stringify({
    event: "llm_check_completed",
    source: result.source,
    provider: result.provider,
    model: result.model,
    score: result.score,
    verdict: result.verdict,
    confidence: result.confidence,
    summary: result.summary,
    matched_skills: result.matched_skills,
    missing_skills: result.missing_skills
  }, null, 2));
}

main().catch((error) => {
  const providerConfig = getProviderConfig();
  console.error(JSON.stringify({
    event: "llm_check_failed",
    provider: providerConfig.provider,
    model: providerConfig.model,
    reason: sanitizeLlmError(error)
  }, null, 2));
  process.exit(1);
});
