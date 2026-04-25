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

test("getProviderConfig supports OpenAI chat completions", () => {
  const { getProviderConfig } = loadLlmServiceWithEnv({
    AI_PROVIDER: "openai",
    OPENAI_API_KEY: "test-openai-key",
    OPENAI_MODEL: "gpt-4.1-mini"
  });

  const config = getProviderConfig();

  assert.equal(config.provider, "openai");
  assert.equal(config.apiKey, "test-openai-key");
  assert.equal(config.model, "gpt-4.1-mini");
  assert.equal(config.url, "https://api.openai.com/v1/chat/completions");
});

test("getProviderConfigs includes OpenRouter fallback key when configured", () => {
  const { getProviderConfigs } = loadLlmServiceWithEnv({
    AI_PROVIDER: "openrouter",
    OPENROUTER_API_KEY: "primary-key",
    OPENROUTER_FALLBACK_API_KEY: "secondary-key",
    OPENROUTER_MODEL: "x-ai/grok-4.1-fast"
  });

  const configs = getProviderConfigs();

  assert.equal(configs.length, 2);
  assert.equal(configs[0].provider, "openrouter");
  assert.equal(configs[0].apiKey, "primary-key");
  assert.equal(configs[1].apiKey, "secondary-key");
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
  const error = new Error("401 Bearer gsk_testSecret123 and sk-or-v1-testSecret456 and sk-proj-testSecret789 failed");

  const message = sanitizeLlmError(error);

  assert.match(message, /401/);
  assert.doesNotMatch(message, /gsk_testSecret123/);
  assert.doesNotMatch(message, /sk-or-v1-testSecret456/);
  assert.doesNotMatch(message, /sk-proj-testSecret789/);
  assert.match(message, /<redacted>/);
});
