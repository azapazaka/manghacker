require("dotenv").config({ path: "../.env" });
const db = require("../src/db/knex");

async function test() {
  try {
    const res = await db.raw("SELECT 1+1 as result");
    console.log("DB connection successful:", res.rows);
    const users = await db("users").select("*").limit(1);
    console.log("Users count:", users.length);
  } catch (err) {
    console.error("DB connection failed:", err.message);
  } finally {
    process.exit(0);
  }
}

test();
