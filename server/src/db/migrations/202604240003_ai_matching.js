exports.up = async function up(knex) {
  await knex.schema.alterTable("users", (table) => {
    table.jsonb("skills").notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.integer("experience_years");
    table.jsonb("preferred_districts").notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.string("preferred_employment_type", 32);
    table.text("profile_summary").defaultTo("");
    table.string("availability", 120).defaultTo("");
    table.timestamp("profile_updated_at");
  });

  await knex.schema.alterTable("vacancies", (table) => {
    table.jsonb("ai_required_skills").notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.integer("ai_min_experience_years");
    table.string("microdistrict", 120).defaultTo("");
    table.string("schedule", 120).defaultTo("");
    table.text("ai_summary").defaultTo("");
  });

  await knex.schema.createTable("ai_match_results", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("seeker_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.uuid("vacancy_id").notNullable().references("id").inTable("vacancies").onDelete("CASCADE");
    table.integer("score").notNullable();
    table.string("verdict", 32).notNullable();
    table.text("summary").notNullable().defaultTo("");
    table.jsonb("reasons").notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.jsonb("risks").notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.jsonb("improvement_tips").notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.jsonb("matched_skills").notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.jsonb("missing_skills").notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.integer("confidence").notNullable().defaultTo(0);
    table.string("source", 32).notNullable().defaultTo("fallback");
    table.string("provider", 32);
    table.string("model", 120);
    table.string("input_hash", 64).notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.unique(["seeker_id", "vacancy_id"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("ai_match_results");

  await knex.schema.alterTable("vacancies", (table) => {
    table.dropColumn("ai_required_skills");
    table.dropColumn("ai_min_experience_years");
    table.dropColumn("microdistrict");
    table.dropColumn("schedule");
    table.dropColumn("ai_summary");
  });

  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("skills");
    table.dropColumn("experience_years");
    table.dropColumn("preferred_districts");
    table.dropColumn("preferred_employment_type");
    table.dropColumn("profile_summary");
    table.dropColumn("availability");
    table.dropColumn("profile_updated_at");
  });
};
