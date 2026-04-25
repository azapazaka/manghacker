exports.up = async function up(knex) {
  await knex.schema.alterTable("ai_match_results", (table) => {
    table.text("employer_summary").notNullable().defaultTo("");
    table.jsonb("interview_focus").notNullable().defaultTo(knex.raw("'[]'::jsonb"));
    table.text("outreach_message").notNullable().defaultTo("");
  });

  await knex.schema.createTable("ai_candidate_outreach", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("vacancy_id").notNullable().references("id").inTable("vacancies").onDelete("CASCADE");
    table.uuid("seeker_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.string("status", 32).notNullable().defaultTo("new");
    table.timestamp("sent_at");
    table.timestamp("responded_at");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.unique(["vacancy_id", "seeker_id"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("ai_candidate_outreach");

  await knex.schema.alterTable("ai_match_results", (table) => {
    table.dropColumn("employer_summary");
    table.dropColumn("interview_focus");
    table.dropColumn("outreach_message");
  });
};
