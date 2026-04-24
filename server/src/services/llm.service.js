const env = require("../config/env");

const MATCH_JSON_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "number" },
    verdict: { type: "string", enum: ["strong", "good", "weak", "not_fit"] },
    summary: { type: "string" },
    reasons: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    improvement_tips: { type: "array", items: { type: "string" } },
    matched_skills: { type: "array", items: { type: "string" } },
    missing_skills: { type: "array", items: { type: "string" } },
    confidence: { type: "number" }
  },
  required: ["score", "verdict", "summary", "reasons", "risks", "improvement_tips", "matched_skills", "missing_skills", "confidence"],
  additionalProperties: false
};

const COMMON_MATCH_PROMPT_RULES = `Контекст платформы:
- Qoldan помогает молодежи, соискателям и малому бизнесу Мангистауской области находить работу и сотрудников.
- Локальный контекст важен: Актау, Жанаозен, районы/микрорайоны, логистика, формат занятости, график, практические навыки.
- Входные данные приходят как JSON с объектами seeker и vacancy. Используй только эти данные.

Границы и безопасность:
- Не выдумывай опыт, навыки, образование, доступность, район или требования, которых нет во входных данных.
- Не используй чувствительные признаки: пол, возраст, национальность, религия, здоровье, инвалидность, семейное положение, беременность, политические взгляды.
- Не делай дискриминационных выводов и не обещай гарантированное трудоустройство или гарантированно подходящего кандидата.
- Если данных мало или они противоречивы, снижай confidence и явно объясняй, каких данных не хватает.

Правила оценки:
- Оценивай только профессиональное соответствие и практическую логистику работы.
- Главные факторы: совпадение навыков, требования вакансии, опыт, район/микрорайон, формат занятости, график, описание профиля, описание вакансии.
- score всегда от 0 до 100.
- verdict выбирай строго по score: 85-100 strong, 65-84 good, 40-64 weak, 0-39 not_fit.
- confidence от 0 до 100 показывает, насколько оценка надежна при имеющихся данных.

JSON-контракт:
- Верни только валидный JSON без markdown, комментариев и текста вокруг.
- Поля должны точно соответствовать схеме: score, verdict, summary, reasons, risks, improvement_tips, matched_skills, missing_skills, confidence.
- summary: 1 короткое предложение на русском.
- reasons, risks, improvement_tips: короткие конкретные пункты, максимум 5.
- matched_skills и missing_skills: только навыки из входных данных или явно очевидные требования вакансии, максимум 8.
- Пиши по-русски, понятно для обычного пользователя, без канцелярита.`;

const SEEKER_MATCH_SYSTEM_PROMPT = `Роль:
Ты AI-matching аналитик Qoldan на стороне соискателя. Твоя задача - помочь человеку понять, насколько конкретная вакансия ему подходит и что можно улучшить в профиле.

Как думать:
- Смотри на вакансию глазами соискателя: стоит ли откликаться, почему да или нет, какие риски есть по требованиям, району, графику и опыту.
- improvement_tips адресуй соискателю: что добавить в профиль, какие навыки уточнить, какие требования подтянуть.
- risks формулируй как возможные причины, почему вакансия может не подойти соискателю.

${COMMON_MATCH_PROMPT_RULES}`;

const EMPLOYER_MATCH_SYSTEM_PROMPT = `Роль:
Ты AI-рекрутер Qoldan на стороне работодателя. Твоя задача - помочь работодателю понять, насколько кандидат подходит под конкретную вакансию и на что обратить внимание перед контактом.

Как думать:
- Смотри на кандидата глазами работодателя: закрывает ли он требования вакансии, какие навыки совпадают, где есть пробелы, насколько понятен профиль.
- improvement_tips адресуй работодателю и кандидату нейтрально: что стоит уточнить на первом контакте или какие данные попросить добавить.
- risks формулируй как проверяемые рабочие вопросы, а не как окончательные негативные выводы.

${COMMON_MATCH_PROMPT_RULES}`;

function getProviderConfig() {
  if (env.aiProvider === "groq") {
    return {
      provider: "groq",
      apiKey: env.groqApiKey,
      model: env.groqModel,
      url: "https://api.groq.com/openai/v1/chat/completions",
      headers: {}
    };
  }

  if (env.aiProvider === "xai") {
    return {
      provider: "xai",
      apiKey: env.xaiApiKey,
      model: env.xaiModel,
      url: "https://api.x.ai/v1/chat/completions",
      headers: {}
    };
  }

  return {
    provider: "openrouter",
    apiKey: env.openRouterApiKey,
    model: env.openRouterModel,
    url: "https://openrouter.ai/api/v1/chat/completions",
    headers: {
      "HTTP-Referer": env.clientOrigin,
      "X-OpenRouter-Title": "Qoldan Mangystau Jobs"
    }
  };
}

function parseModelContent(content) {
  if (!content) {
    throw new Error("LLM response is empty.");
  }

  if (typeof content === "object") {
    return content;
  }

  const trimmed = String(content).trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(trimmed);
}

function normalizeAnalysisPayload(value) {
  const score = Math.max(0, Math.min(100, Math.round(Number(value.score) || 0)));
  const confidence = Math.max(0, Math.min(100, Math.round(Number(value.confidence) || 0)));
  const verdict = ["strong", "good", "weak", "not_fit"].includes(value.verdict) ? value.verdict : score >= 85 ? "strong" : score >= 65 ? "good" : score >= 40 ? "weak" : "not_fit";

  return {
    score,
    verdict,
    summary: String(value.summary || "").trim(),
    reasons: Array.isArray(value.reasons) ? value.reasons.map(String).filter(Boolean).slice(0, 5) : [],
    risks: Array.isArray(value.risks) ? value.risks.map(String).filter(Boolean).slice(0, 5) : [],
    improvement_tips: Array.isArray(value.improvement_tips) ? value.improvement_tips.map(String).filter(Boolean).slice(0, 5) : [],
    matched_skills: Array.isArray(value.matched_skills) ? value.matched_skills.map(String).filter(Boolean).slice(0, 8) : [],
    missing_skills: Array.isArray(value.missing_skills) ? value.missing_skills.map(String).filter(Boolean).slice(0, 8) : [],
    confidence
  };
}

function sanitizeLlmError(error) {
  return String(error?.message || error || "Unknown LLM error")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer <redacted>")
    .replace(/gsk_[A-Za-z0-9_-]+/g, "<redacted>")
    .replace(/sk-or-v1-[A-Za-z0-9_-]+/g, "<redacted>");
}

async function requestMatchAnalysis({ payload, audience = "seeker" }) {
  const providerConfig = getProviderConfig();

  if (!providerConfig.apiKey) {
    throw new Error(`${providerConfig.provider} API key is not configured.`);
  }

  const response = await fetch(providerConfig.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${providerConfig.apiKey}`,
      "Content-Type": "application/json",
      ...providerConfig.headers
    },
    body: JSON.stringify({
      model: providerConfig.model,
      stream: false,
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content: audience === "employer" ? EMPLOYER_MATCH_SYSTEM_PROMPT : SEEKER_MATCH_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: JSON.stringify(payload)
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "qoldan_match_analysis",
          strict: true,
          schema: MATCH_JSON_SCHEMA
        }
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LLM request failed with ${response.status}: ${body.slice(0, 180)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  return {
    ...normalizeAnalysisPayload(parseModelContent(content)),
    source: "llm",
    provider: providerConfig.provider,
    model: providerConfig.model
  };
}

module.exports = {
  requestMatchAnalysis,
  getProviderConfig,
  sanitizeLlmError,
  MATCH_JSON_SCHEMA,
  SEEKER_MATCH_SYSTEM_PROMPT,
  EMPLOYER_MATCH_SYSTEM_PROMPT
};
