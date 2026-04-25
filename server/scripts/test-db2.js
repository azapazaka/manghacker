require("dotenv").config({ path: "../.env" });
const db = require("../src/db/knex");

async function run() {
  try {
    // just to check if db is fine
    const users = await db("users").select("*").limit(1);
    console.log("Users:", users.length);
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    process.exit(0);
  }
}
run();
