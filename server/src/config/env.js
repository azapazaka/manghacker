const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const serverRoot = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(serverRoot, ".env") });

const uploadDir = path.resolve(serverRoot, process.env.UPLOAD_DIR || "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

module.exports = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  databaseSsl: String(process.env.DATABASE_SSL || "false").toLowerCase() === "true",
  databasePoolMin: Number(process.env.DATABASE_POOL_MIN || 0),
  databasePoolMax: Number(process.env.DATABASE_POOL_MAX || 10),
  jwtSecret: process.env.JWT_SECRET || "replace_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || "QoldanBot",
  telegramMode: process.env.TELEGRAM_MODE || "polling",
  telegramWebhookUrl: process.env.TELEGRAM_WEBHOOK_URL || "",
  telegramWebhookPath: process.env.TELEGRAM_WEBHOOK_PATH || "/api/telegram/webhook",
  uploadDir,
  fileStorageDriver: process.env.FILE_STORAGE_DRIVER || "local",
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || "resumes",
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 5),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3001",
  devClientUrl: process.env.DEV_CLIENT_URL || "http://127.0.0.1:5173"
};
