require("dotenv").config({ path: "../.env" });
const db = require("../src/db/knex");

async function checkUsers() {
  try {
    const users = await db("users").select("id", "email", "telegram_username", "telegram_chat_id").orderBy("created_at", "desc").limit(5);
    console.log(users);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkUsers();
