const path = require("path");
const env = require("../config/env");

module.exports = {
  development: {
    client: "pg",
    connection: env.databaseSsl
      ? {
          connectionString: env.databaseUrl,
          ssl: { rejectUnauthorized: false }
        }
      : env.databaseUrl,
    migrations: {
      directory: path.join(__dirname, "migrations")
    }
  }
};
