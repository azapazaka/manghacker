const app = require("./app");
const env = require("./config/env");
const { initTelegramBot } = require("./services/telegram.service");

const server = app.listen(env.port, async () => {
  await initTelegramBot();
  console.log(`Qoldan API is running on port ${env.port}`);
});

if (app.locals.viteProxy?.upgrade) {
  server.on("upgrade", app.locals.viteProxy.upgrade);
}
