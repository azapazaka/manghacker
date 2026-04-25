const test = require("node:test");
const assert = require("node:assert/strict");
const { buildEmployerInsights, computeFallbackMatch, createLlmFallbackLogEntry } = require("./match.service");

test("computeFallbackMatch rewards matching skills, district, employment type, and experience", () => {
  const result = computeFallbackMatch({
    seeker: {
      skills: ["касса", "продажи", "telegram"],
      preferred_districts: ["Актау"],
      preferred_employment_type: "part_time",
      experience_years: 2
    },
    vacancy: {
      ai_required_skills: ["касса", "продажи"],
      district: "Актау",
      employment_type: "part_time",
      ai_min_experience_years: 1
    }
  });

  assert.equal(result.source, "fallback");
  assert.ok(result.score >= 85);
  assert.equal(result.verdict, "strong");
  assert.deepEqual(result.matched_skills.sort(), ["касса", "продажи"]);
  assert.equal(result.missing_skills.length, 0);
});

test("computeFallbackMatch lowers confidence and explains missing profile data", () => {
  const result = computeFallbackMatch({
    seeker: {
      skills: [],
      preferred_districts: [],
      preferred_employment_type: "",
      experience_years: null
    },
    vacancy: {
      ai_required_skills: ["бариста"],
      district: "Актау",
      employment_type: "full_time",
      ai_min_experience_years: 1
    }
  });

  assert.equal(result.source, "fallback");
  assert.ok(result.score < 50);
  assert.equal(result.verdict, "not_fit");
  assert.ok(result.confidence < 50);
  assert.ok(result.improvement_tips.some((tip) => tip.includes("навыки")));
});

test("createLlmFallbackLogEntry includes context without leaking tokens", () => {
  const entry = createLlmFallbackLogEntry({
    providerConfig: {
      provider: "groq",
      model: "llama-3.3-70b-versatile"
    },
    audience: "seeker",
    payload: {
      seeker: { id: 7 },
      vacancy: { id: 12 }
    },
    error: new Error("401 Bearer gsk_testSecret123")
  });

  assert.deepEqual(entry, {
    event: "llm_match_fallback",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    audience: "seeker",
    seeker_id: 7,
    vacancy_id: 12,
    reason: "401 Bearer <redacted>"
  });
});

test("buildEmployerInsights adds recruiter-facing fields for employer matching", () => {
  const result = buildEmployerInsights(
    {
      score: 88,
      summary: "Совпадают ключевые навыки и формат работы.",
      matched_skills: ["касса", "продажи"],
      missing_skills: ["1с"]
    },
    {
      seeker: { name: "Алия" },
      vacancy: { title: "Продавец-кассир" }
    }
  );

  assert.match(result.employer_summary, /Алия/);
  assert.ok(Array.isArray(result.interview_focus));
  assert.ok(result.interview_focus.length >= 2);
  assert.match(result.outreach_message, /Продавец-кассир/);
});
