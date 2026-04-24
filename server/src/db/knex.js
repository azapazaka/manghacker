const knex = require("knex");
const env = require("../config/env");

const connection = env.databaseSsl
  ? {
      connectionString: env.databaseUrl,
      ssl: { rejectUnauthorized: false }
    }
  : env.databaseUrl;

const db = knex({
  client: "pg",
  connection,
  pool: { min: env.databasePoolMin, max: env.databasePoolMax }
});

module.exports = db;
