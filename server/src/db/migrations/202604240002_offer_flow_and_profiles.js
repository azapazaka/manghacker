exports.up = async function up(knex) {
  await knex.schema.alterTable("users", (table) => {
    table.string("full_name", 150);
    table.string("contact_name", 150);
    table.string("company_name", 150);
  });

  await knex.schema.alterTable("applications", (table) => {
    table.string("status", 32).notNullable().defaultTo("applied");
    table.timestamp("offer_sent_at");
    table.timestamp("decision_at");
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex("users").where({ role: "seeker" }).update({
    full_name: knex.raw("COALESCE(full_name, name)")
  });

  await knex("users").where({ role: "employer" }).update({
    contact_name: knex.raw("COALESCE(contact_name, name)"),
    company_name: knex.raw("COALESCE(company_name, NULLIF(name, ''), email)")
  });

  await knex("applications").update({
    status: knex.raw("COALESCE(status, 'applied')"),
    updated_at: knex.fn.now()
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable("applications", (table) => {
    table.dropColumn("status");
    table.dropColumn("offer_sent_at");
    table.dropColumn("decision_at");
    table.dropColumn("updated_at");
  });

  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("full_name");
    table.dropColumn("contact_name");
    table.dropColumn("company_name");
  });
};
