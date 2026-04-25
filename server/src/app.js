const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");
const env = require("./config/env");
const db = require("./db/knex");
const authRoutes = require("./routes/auth.routes");
const vacancyRoutes = require("./routes/vacancy.routes");
const applicationRoutes = require("./routes/application.routes");
const profileRoutes = require("./routes/profile.routes");
const matchRoutes = require("./routes/match.routes");
const { getTelegramWebhookPath, initTelegramBot } = require("./services/telegram.service");

const app = express();
const clientDistDir = path.resolve(__dirname, "../../client/dist");

function uniqueOrigins(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function extractOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isAllowedOrigin(origin, allowedOrigins, allowedOriginSuffixes) {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return allowedOriginSuffixes.some((suffix) => {
      const normalizedSuffix = suffix.toLowerCase();
      return hostname === normalizedSuffix.replace(/^\./, "") || hostname.endsWith(normalizedSuffix);
    });
  } catch {
    return false;
  }
}

function createDevFallbackPage() {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Qoldan Dev Server</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: linear-gradient(180deg, #fbfaf9 0%, #f5f4f1 100%);
        font-family: "Segoe UI", sans-serif;
        color: #111827;
      }

      main {
        max-width: 720px;
        margin: 24px;
        padding: 32px;
        border: 1px solid rgba(255, 255, 255, 0.8);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
      }

      code {
        padding: 2px 8px;
        border-radius: 999px;
        background: #f3f4f6;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Frontend dev server пока не готов</h1>
      <p>Основной локальный вход в проект теперь работает через <code>http://localhost:${env.port}</code>.</p>
      <p>Backend уже поднят, но Vite еще не успел запуститься по адресу <code>${env.devClientUrl}</code>.</p>
      <p>Подождите несколько секунд и обновите страницу. Запускать проект нужно одной командой из корня: <code>npm run dev</code>.</p>
    </main>
  </body>
</html>`;
}

const allowedOrigins = uniqueOrigins([
  ...env.clientOrigins,
  extractOrigin(env.devClientUrl),
  `http://localhost:${env.port}`,
  `http://127.0.0.1:${env.port}`,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin, allowedOrigins, env.allowedOriginSuffixes)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin is not allowed."));
    },
    credentials: true
  })
);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(env.uploadDir)));

app.post(getTelegramWebhookPath(), async (req, res) => {
  const bot = await initTelegramBot();

  if (!bot) {
    return res.status(503).json({ message: "Telegram bot is not configured." });
  }

  bot.processUpdate(req.body);
  return res.sendStatus(200);
});

app.get("/api/health", async (_, res) => {
  try {
    await db.raw("select 1");
    res.json({
      ok: true,
      database: "connected",
      storage: env.fileStorageDriver,
      telegramMode: env.telegramMode
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      database: "disconnected",
      storage: env.fileStorageDriver,
      telegramMode: env.telegramMode
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/vacancies", vacancyRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/matches", matchRoutes);

let viteProxy = null;

if (env.nodeEnv === "development") {
  viteProxy = createProxyMiddleware({
    target: env.devClientUrl,
    changeOrigin: true,
    ws: true,
    xfwd: true,
    onError(_, req, res) {
      if (res.headersSent) {
        return;
      }

      if (req.headers.accept?.includes("text/html")) {
        res.status(503).send(createDevFallbackPage());
        return;
      }

      res.status(503).json({
        message: "Frontend dev server is not ready yet. Start the project from the repo root with `npm run dev`."
      });
    }
  });

  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      next();
      return;
    }

    viteProxy(req, res, next);
  });
} else if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      next();
      return;
    }

    res.sendFile(path.join(clientDistDir, "index.html"));
  });
}

app.locals.viteProxy = viteProxy;

app.use((error, _, res, __) => {
  if (error?.message?.includes("PDF")) {
    return res.status(400).json({ message: error.message });
  }

  if (error?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: `Максимальный размер файла ${env.maxFileSizeMb} MB.` });
  }

  if (error?.message === "CORS origin is not allowed.") {
    return res.status(403).json({ message: "Origin is not allowed by CORS." });
  }

  console.error(error);
  return res.status(500).json({ message: "Внутренняя ошибка сервера." });
});

module.exports = app;
