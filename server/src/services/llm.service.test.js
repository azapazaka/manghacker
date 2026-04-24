const test = require("node:test");
const assert = require("node:assert/strict");

function loadLlmServiceWithEnv(overrides) {
  const originalEnv = { ...process.env };
  Object.assign(process.env, overrides);

  delete require.cache[require.resolve("../config/env")];
  delete require.cache[require.resolve("./llm.service")];

  const service = require("./llm.service");

  process.env = originalEnv;
  delete require.cache[require.resolve("../config/env")];
  delete require.cache[require.resolve("./llm.service")];

  return service;
}

test("getProviderConfig supports Groq chat completions", () => {
  const { getProviderConfig } = loadLlmServiceWithEnv({
    AI_PROVIDER: "groq",
    GROQ_API_KEY: "test-groq-key",
    GROQ_MODEL: "llama-3.3-70b-versatile"
  });

  const config = getProviderConfig();

  assert.equal(config.provider, "groq");
  assert.equal(config.apiKey, "test-groq-key");
  assert.equal(config.model, "llama-3.3-70b-versatile");
  assert.equal(config.url, "https://api.groq.com/openai/v1/chat/completions");
});

test("system prompts explain role, boundaries, scoring, and JSON contract", () => {
  const { SEEKER_MATCH_SYSTEM_PROMPT, EMPLOYER_MATCH_SYSTEM_PROMPT } = loadLlmServiceWithEnv({});

  for (const prompt of [SEEKER_MATCH_SYSTEM_PROMPT, EMPLOYER_MATCH_SYSTEM_PROMPT]) {
    assert.match(prompt, /Роль/i);
    assert.match(prompt, /Контекст/i);
    assert.match(prompt, /Правила оценки/i);
    assert.match(prompt, /Не выдумывай/i);
    assert.match(prompt, /JSON/i);
    assert.match(prompt, /score/i);
    assert.match(prompt, /confidence/i);
    assert.match(prompt, /чувствительные признаки/i);
  }
});

test("sanitizeLlmError removes API tokens from log messages", () => {
  const { sanitizeLlmError } = loadLlmServiceWithEnv({});
  const error = new Error("401 Bearer gsk_testSecret123 and sk-or-v1-testSecret456 failed");

  const message = sanitizeLlmError(error);

  assert.match(message, /401/);
  assert.doesNotMatch(message, /gsk_testSecret123/);
  assert.doesNotMatch(message, /sk-or-v1-testSecret456/);
  assert.match(message, /<redacted>/);
});
