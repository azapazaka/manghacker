const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const db = require("../db/knex");
const env = require("../config/env");

let bot;
let initialized = false;
let inboundUpdatesDisabled = false;
let conflictWarningShown = false;

function normalizeUsername(value) {
  return value ? value.replace(/^@/, "").trim().toLowerCase() : "";
}

async function bindStartHandler(activeBot) {
  activeBot.onText(/\/start/, async (msg) => {
    const username = normalizeUsername(msg.from?.username);

    if (username) {
      await db("users").whereRaw("LOWER(telegram_username) = ?", [username]).update({ telegram_chat_id: msg.chat.id });
    }

    await activeBot.sendMessage(msg.chat.id, "Qoldan подключен. Здесь вы будете получать отклики, офферы и статусы по вакансиям.");
  });
}

async function initTelegramBot() {
  if (initialized) {
    return bot;
  }

  initialized = true;

  if (!env.telegramBotToken || env.telegramMode === "disabled") {
    return bot;
  }

  const useWebhook = env.telegramMode === "webhook" && Boolean(env.telegramWebhookUrl);
  bot = new TelegramBot(env.telegramBotToken, useWebhook ? { webHook: true } : { polling: true });

  await bindStartHandler(bot);

  if (useWebhook) {
    const webhookUrl = `${env.telegramWebhookUrl.replace(/\/$/, "")}${env.telegramWebhookPath}`;
    await bot.setWebHook(webhookUrl);
  }

  bot.on("polling_error", (error) => {
    const message = String(error?.message || "");

    if (message.includes("409 Conflict")) {
      inboundUpdatesDisabled = true;

      if (!conflictWarningShown) {
        conflictWarningShown = true;
        console.warn("Telegram polling disabled: another bot instance is already consuming getUpdates. Outbound Telegram notifications will continue to work.");
      }

      if (typeof bot.stopPolling === "function") {
        bot.stopPolling().catch(() => {});
      }
      return;
    }

    console.error("Telegram polling error:", message);
  });

  return bot;
}

async function sendResumeToEmployer(chatId, filePath, { vacancyTitle, seekerName, seekerEmail, seekerTelegram }) {
  const activeBot = await initTelegramBot();

  if (!activeBot) {
    throw new Error("Telegram bot token is missing.");
  }

  const caption = [`Новый отклик на вакансию: ${vacancyTitle}`, `Соискатель: ${seekerName}`, `Email: ${seekerEmail}`, `Telegram: @${seekerTelegram}`].join("\n");

  await activeBot.sendDocument(chatId, fs.createReadStream(filePath), { caption });
}

async function sendOfferToSeeker(chatId, { vacancyTitle, companyName, district }) {
  const activeBot = await initTelegramBot();

  if (!activeBot) {
    throw new Error("Telegram bot token is missing.");
  }

  const message = [
    "Вам отправили оффер.",
    `Вакансия: ${vacancyTitle}`,
    `Компания: ${companyName}`,
    `Локация: ${district}`,
    "Зайдите на сайт Qoldan и примите или отклоните оффер в разделе почты."
  ].join("\n");

  await activeBot.sendMessage(chatId, message);
}

async function sendOfferDecisionToEmployer(chatId, { vacancyTitle, seekerName, decision }) {
  const activeBot = await initTelegramBot();

  if (!activeBot) {
    throw new Error("Telegram bot token is missing.");
  }

  const humanDecision = decision === "accepted" ? "принял оффер" : "отклонил оффер";
  const message = ["Решение по офферу", `Вакансия: ${vacancyTitle}`, `${seekerName} ${humanDecision}.`].join("\n");

  await activeBot.sendMessage(chatId, message);
}

async function sendInvitationToSeeker(chatId, { vacancyTitle, companyName, score, message }) {
  const activeBot = await initTelegramBot();

  if (!activeBot) {
    throw new Error("Telegram bot token is missing.");
  }

  const text = [
    "Новая рекомендация от работодателя",
    `Вакансия: ${vacancyTitle}`,
    `Компания: ${companyName}`,
    score ? `Совпадение AI: ${score}%` : null,
    message || "Ваш профиль показался работодателю релевантным. Откройте Qoldan и откликнитесь, если вакансия вам подходит."
  ]
    .filter(Boolean)
    .join("\n");

  await activeBot.sendMessage(chatId, text);
}

function getTelegramWebhookPath() {
  return env.telegramWebhookPath;
}

function isTelegramInboundDisabled() {
  return inboundUpdatesDisabled;
}

module.exports = {
  initTelegramBot,
  sendResumeToEmployer,
  sendOfferToSeeker,
  sendOfferDecisionToEmployer,
  sendInvitationToSeeker,
  getTelegramWebhookPath,
  isTelegramInboundDisabled
};
