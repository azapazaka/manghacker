exports.up = async function up(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.enu("role", ["seeker", "employer"]).notNullable();
    table.string("name", 100).notNullable();
    table.string("email", 150).notNullable().unique();
    table.text("password_hash").notNullable();
    table.string("telegram_username", 50);
    table.bigInteger("telegram_chat_id");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("vacancies", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("employer_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("title", 150).notNullable();
    table.text("description").notNullable();
    table.text("requirements").defaultTo("");
    table.enu("employment_type", ["full_time", "part_time", "contract"]).notNullable();
    table.integer("salary");
    table.string("district", 100).notNullable();
    table.string("category", 100).notNullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("applications", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("vacancy_id").notNullable().references("id").inTable("vacancies").onDelete("CASCADE");
    table.uuid("seeker_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.text("resume_path").notNullable();
    table.enu("tg_status", ["sent", "failed"]).notNullable().defaultTo("sent");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["vacancy_id", "seeker_id"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("applications");
  await knex.schema.dropTableIfExists("vacancies");
  await knex.schema.dropTableIfExists("users");
};
