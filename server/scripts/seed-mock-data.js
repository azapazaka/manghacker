require("dotenv").config({ path: "../.env" });
const bcrypt = require("bcryptjs");
const db = require("../src/db/knex");
const { refreshVacancyMatches } = require("../src/services/match.service");

const EMPLOYER_EMAIL = "demo.employer.aktau@qoldan.kz";
const EMPLOYER_DEFAULTS = {
  company_name: "Aktau City Jobs Hub",
  contact_name: "Менеджер по найму Актау",
  telegram_username: "aktau_hiring_demo"
};

const DEMO_PASSWORD = "123456";
const DEMO_PREFIX = "DEMO AI";

const demoVacancies = [
  {
    title: `${DEMO_PREFIX} · Продавец-кассир (15 мкр)`,
    category: "Розничная торговля",
    district: "Актау",
    microdistrict: "15 мкр",
    employment_type: "full_time",
    schedule: "2/2",
    salary: 260000,
    ai_required_skills: ["касса", "продажи", "обслуживание клиентов", "выкладка"],
    ai_min_experience_years: 1,
    ai_summary: "Сильный кандидат должен уверенно работать с кассой, покупателями и выкладкой в магазине у дома.",
    description: "Магазин у дома в 15 микрорайоне ищет продавца-кассира на стабильный график. Нужен человек, который быстро включится в смену и спокойно работает с потоком покупателей.",
    requirements: "Опыт работы с кассой, базовые продажи, аккуратность в выкладке, уважительное общение с клиентами."
  },
  {
    title: `${DEMO_PREFIX} · Бариста (17 мкр)`,
    category: "Рестораны/Общепит",
    district: "Актау",
    microdistrict: "17 мкр",
    employment_type: "part_time",
    schedule: "Вечерняя смена",
    salary: 240000,
    ai_required_skills: ["приготовление кофе", "касса", "сервис", "чистота"],
    ai_min_experience_years: 1,
    ai_summary: "Лучше всего подойдут кандидаты с опытом на кофейной точке и готовностью к вечерним сменам.",
    description: "Небольшая кофейня в 17 микрорайоне ищет бариста на вечерние смены. Важно быстро готовить напитки, держать чистоту и дружелюбно общаться с гостями.",
    requirements: "Опыт приготовления кофе, работа с кассой, сервис, дисциплина по чистоте и скорости."
  },
  {
    title: `${DEMO_PREFIX} · Курьер на доставку (по Актау)`,
    category: "Логистика/Доставка",
    district: "Актау",
    microdistrict: "по городу",
    employment_type: "contract",
    schedule: "Гибкий",
    salary: 320000,
    ai_required_skills: ["знание города", "навигация", "пунктуальность", "бережная доставка"],
    ai_min_experience_years: 0,
    ai_summary: "Подойдут мобильные кандидаты, хорошо знающие Актау и готовые быстро выходить на линию.",
    description: "Сервис доставки ищет курьера по Актау. Важно ориентироваться по микрорайонам, вовремя доставлять заказы и быть на связи со сменой.",
    requirements: "Хорошее знание города, дисциплина, пунктуальность, навигация и аккуратность в доставке."
  },
  {
    title: `${DEMO_PREFIX} · Офис-ассистент / ресепшн`,
    category: "Административный персонал",
    district: "Актау",
    microdistrict: "12 мкр",
    employment_type: "full_time",
    schedule: "5/2",
    salary: 250000,
    ai_required_skills: ["документооборот", "звонки", "координация", "деловая переписка"],
    ai_min_experience_years: 1,
    ai_summary: "Нужен аккуратный человек с опытом базового администрирования и понятной коммуникацией.",
    description: "В офис в 12 микрорайоне нужен ассистент на ресепшн. Важны аккуратность в документах, прием звонков и координация внутренних задач.",
    requirements: "Опыт работы с документами, входящие звонки, координация встреч и базовая деловая переписка."
  }
];

const demoSeekers = [
  {
    email: "demo.seeker.ai.aigerim.cashier@qoldan.kz",
    full_name: "Айгерим Сейтова",
    telegram_username: "demo_aigerim_cashier",
    desiredFor: ["Продавец-кассир (15 мкр)"],
    skills: ["касса", "продажи", "обслуживание клиентов", "выкладка"],
    experience_years: 2,
    preferred_districts: ["15 мкр", "14 мкр", "12 мкр"],
    preferred_employment_type: "full_time",
    availability: "nearby",
    profile_summary: "2 года работала продавцом-кассиром в минимаркете в Актау. Спокойно веду кассу, работаю с полкой и люблю понятный поток задач."
  },
  {
    email: "demo.seeker.ai.dias.retail@qoldan.kz",
    full_name: "Диас Омаров",
    telegram_username: "demo_dias_retail",
    desiredFor: ["Продавец-кассир (15 мкр)"],
    skills: ["касса", "продажи", "мерчендайзинг", "отчетность"],
    experience_years: 1,
    preferred_districts: ["15 мкр", "17 мкр"],
    preferred_employment_type: "full_time",
    availability: "city",
    profile_summary: "Работал в торговом зале и на кассе, быстро ориентируюсь в остатках и умею общаться с покупателями без конфликтов."
  },
  {
    email: "demo.seeker.ai.madina.barista@qoldan.kz",
    full_name: "Мадина Жаксылыкова",
    telegram_username: "demo_madina_barista",
    desiredFor: ["Бариста (17 мкр)"],
    skills: ["приготовление кофе", "касса", "сервис", "чистота"],
    experience_years: 2,
    preferred_districts: ["17 мкр", "16 мкр", "15 мкр"],
    preferred_employment_type: "part_time",
    availability: "вечером, после учебы",
    profile_summary: "Работала бариста в кофейне возле университета, уверенно делаю базовую кофейную карту, держу темп в вечерний поток."
  },
  {
    email: "demo.seeker.ai.nursultan.barista@qoldan.kz",
    full_name: "Нурсултан Беков",
    telegram_username: "demo_nursultan_barista",
    desiredFor: ["Бариста (17 мкр)"],
    skills: ["приготовление кофе", "сервис", "продажи", "касса"],
    experience_years: 1,
    preferred_districts: ["17 мкр", "18 мкр"],
    preferred_employment_type: "part_time",
    availability: "вечерние смены и выходные",
    profile_summary: "Есть опыт в кофейне и в точке to-go. Нормально работаю в команде, умею допродавать десерты и быстро принимать заказ."
  },
  {
    email: "demo.seeker.ai.alibek.delivery@qoldan.kz",
    full_name: "Алибек Нургалиев",
    telegram_username: "demo_alibek_delivery",
    desiredFor: ["Курьер на доставку (по Актау)"],
    skills: ["знание города", "навигация", "пунктуальность", "бережная доставка"],
    experience_years: 2,
    preferred_districts: ["Актау", "по городу"],
    preferred_employment_type: "contract",
    availability: "city",
    profile_summary: "Работал в доставке еды и документов по Актау. Хорошо знаю микрорайоны, быстро реагирую и держу связь со сменой."
  },
  {
    email: "demo.seeker.ai.zhanerke.delivery@qoldan.kz",
    full_name: "Жанерке Абилда",
    telegram_username: "demo_zhanerke_delivery",
    desiredFor: ["Курьер на доставку (по Актау)"],
    skills: ["знание города", "коммуникация", "навигация", "ответственность"],
    experience_years: 1,
    preferred_districts: ["Актау"],
    preferred_employment_type: "contract",
    availability: "гибкий график, могу выйти быстро",
    profile_summary: "Ищу гибкую работу по городу. Есть опыт в доставке небольших заказов и хорошее знание центральных микрорайонов Актау."
  },
  {
    email: "demo.seeker.ai.assel.office@qoldan.kz",
    full_name: "Асель Ергалиева",
    telegram_username: "demo_assel_office",
    desiredFor: ["Офис-ассистент / ресепшн"],
    skills: ["документооборот", "звонки", "координация", "деловая переписка"],
    experience_years: 2,
    preferred_districts: ["12 мкр", "11 мкр", "13 мкр"],
    preferred_employment_type: "full_time",
    availability: "nearby",
    profile_summary: "Работала офис-ассистентом и администратором, веду документы, принимаю звонки и держу порядок в расписании."
  },
  {
    email: "demo.seeker.ai.ruslan.office@qoldan.kz",
    full_name: "Руслан Касенов",
    telegram_username: "demo_ruslan_office",
    desiredFor: ["Офис-ассистент / ресепшн"],
    skills: ["звонки", "MS Office", "координация", "документооборот"],
    experience_years: 1,
    preferred_districts: ["12 мкр", "14 мкр"],
    preferred_employment_type: "full_time",
    availability: "5/2, полный день",
    profile_summary: "Есть опыт на ресепшн и базовой административной поддержке. Спокойно работаю с входящими звонками и внутренними задачами."
  },
  {
    email: "demo.seeker.ai.kamila.mix@qoldan.kz",
    full_name: "Камила Ибраева",
    telegram_username: "demo_kamila_mix",
    desiredFor: ["Бариста (17 мкр)", "Офис-ассистент / ресепшн"],
    skills: ["касса", "сервис", "звонки", "документооборот"],
    experience_years: 1,
    preferred_districts: ["16 мкр", "17 мкр", "12 мкр"],
    preferred_employment_type: "part_time",
    availability: "after classes",
    profile_summary: "Совмещала учебу с работой в сервисе и частично помогала в офисе. Хороша в коммуникации, но ищу понятный спокойный график."
  },
  {
    email: "demo.seeker.ai.yerzhan.mid@qoldan.kz",
    full_name: "Ержан Турсын",
    telegram_username: "demo_yerzhan_mid",
    desiredFor: ["Продавец-кассир (15 мкр)", "Курьер на доставку (по Актау)"],
    skills: ["продажи", "пунктуальность", "знание города", "касса"],
    experience_years: 1,
    preferred_districts: ["Актау", "15 мкр"],
    preferred_employment_type: "contract",
    availability: "city",
    profile_summary: "Работал и в торговле, и в доставке. Быстро вхожу в новые процессы, но больше комфортен в подвижной работе."
  },
  {
    email: "demo.seeker.ai.akbota.weak@qoldan.kz",
    full_name: "Акбота Серик",
    telegram_username: "demo_akbota_weak",
    desiredFor: ["Бариста (17 мкр)"],
    skills: ["Instagram", "сторис", "съемка", "контент"],
    experience_years: 0,
    preferred_districts: ["29 мкр"],
    preferred_employment_type: "part_time",
    availability: "nearby",
    profile_summary: "Ищу первую работу ближе к дому, раньше занималась только контентом для знакомых и волонтерских проектов."
  },
  {
    email: "demo.seeker.ai.marat.weak@qoldan.kz",
    full_name: "Марат Сагындык",
    telegram_username: "demo_marat_weak",
    desiredFor: ["Офис-ассистент / ресепшн"],
    skills: ["сварка", "инструменты", "ремонт", "ТБ"],
    experience_years: 3,
    preferred_districts: ["Промзона"],
    preferred_employment_type: "contract",
    availability: "вахта",
    profile_summary: "Сильнее всего в производственных задачах и ремонте. Офисная работа не была моей основной специализацией."
  },
  {
    email: "demo.seeker.ai.aida.weak@qoldan.kz",
    full_name: "Аида Шарипова",
    telegram_username: "demo_aida_weak",
    desiredFor: ["Курьер на доставку (по Актау)"],
    skills: ["деловая переписка", "документооборот", "звонки", "координация"],
    experience_years: 2,
    preferred_districts: ["12 мкр"],
    preferred_employment_type: "full_time",
    availability: "только офис 5/2",
    profile_summary: "Хорошо чувствую себя в офисной среде, люблю порядок и четкие задачи, но не ищу разъездной формат."
  }
];

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureEmployer(passwordHash) {
  let employer = await db("users").where({ email: EMPLOYER_EMAIL }).first();

  if (!employer) {
    [employer] = await db("users")
      .insert({
        name: EMPLOYER_DEFAULTS.contact_name,
        email: EMPLOYER_EMAIL,
        password_hash: passwordHash,
        role: "employer",
        company_name: EMPLOYER_DEFAULTS.company_name,
        contact_name: EMPLOYER_DEFAULTS.contact_name,
        telegram_username: EMPLOYER_DEFAULTS.telegram_username
      })
      .returning("*");
  } else {
    [employer] = await db("users")
      .where({ id: employer.id })
      .update({
        company_name: EMPLOYER_DEFAULTS.company_name,
        contact_name: EMPLOYER_DEFAULTS.contact_name,
        telegram_username: EMPLOYER_DEFAULTS.telegram_username
      })
      .returning("*");
  }

  return employer;
}

async function upsertVacancy(employerId, vacancy) {
  const existing = await db("vacancies").where({ employer_id: employerId, title: vacancy.title }).first();
  const patch = {
    employer_id: employerId,
    title: vacancy.title,
    category: vacancy.category,
    district: vacancy.district,
    microdistrict: vacancy.microdistrict,
    employment_type: vacancy.employment_type,
    schedule: vacancy.schedule,
    salary: vacancy.salary,
    ai_required_skills: JSON.stringify(vacancy.ai_required_skills),
    ai_min_experience_years: vacancy.ai_min_experience_years,
    ai_summary: vacancy.ai_summary,
    description: vacancy.description,
    requirements: vacancy.requirements,
    is_active: true,
    updated_at: db.fn.now()
  };

  if (existing) {
    const [updated] = await db("vacancies").where({ id: existing.id }).update(patch).returning("*");
    return updated;
  }

  const [created] = await db("vacancies").insert(patch).returning("*");
  return created;
}

async function upsertSeeker(passwordHash, seeker) {
  const fallbackName = seeker.full_name.split(" ")[0];
  const payload = {
    role: "seeker",
    name: fallbackName,
    full_name: seeker.full_name,
    email: seeker.email,
    password_hash: passwordHash,
    telegram_username: seeker.telegram_username,
    skills: JSON.stringify(seeker.skills),
    experience_years: seeker.experience_years,
    preferred_districts: JSON.stringify(seeker.preferred_districts),
    preferred_employment_type: seeker.preferred_employment_type,
    profile_summary: seeker.profile_summary,
    availability: seeker.availability,
    profile_updated_at: db.fn.now()
  };

  const existing = await db("users").where({ email: seeker.email }).first();
  if (existing) {
    const [updated] = await db("users").where({ id: existing.id }).update(payload).returning("*");
    return updated;
  }

  const [created] = await db("users").insert(payload).returning("*");
  return created;
}

async function clearDemoApplications(demoSeekerIds, demoVacancyIds) {
  if (!demoSeekerIds.length || !demoVacancyIds.length) return;

  await db("applications").whereIn("seeker_id", demoSeekerIds).whereIn("vacancy_id", demoVacancyIds).del();
  await db("ai_candidate_outreach").whereIn("seeker_id", demoSeekerIds).whereIn("vacancy_id", demoVacancyIds).del();
}

async function warmMatches(employerId, vacancyIds) {
  for (const vacancyId of vacancyIds) {
    await refreshVacancyMatches({ employerId, vacancyId });
  }
}

async function printTopMatches(vacancyIds) {
  const matches = await db("ai_match_results")
    .join("vacancies", "ai_match_results.vacancy_id", "vacancies.id")
    .join("users", "ai_match_results.seeker_id", "users.id")
    .whereIn("vacancy_id", vacancyIds)
    .select(
      "vacancies.title as vacancy_title",
      "users.full_name",
      "ai_match_results.score",
      "ai_match_results.summary",
      "ai_match_results.employer_summary",
      "ai_match_results.provider",
      "ai_match_results.model",
      "ai_match_results.source"
    )
    .orderBy([
      { column: "vacancy_title", order: "asc" },
      { column: "score", order: "desc" }
    ]);

  const grouped = new Map();
  for (const row of matches) {
    const current = grouped.get(row.vacancy_title) || [];
    if (current.length < 3) {
      current.push(row);
      grouped.set(row.vacancy_title, current);
    }
  }

  for (const [vacancyTitle, rows] of grouped.entries()) {
    console.log(`\nTop matches for: ${vacancyTitle}`);
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.full_name} — ${row.score}% [${row.source}${row.provider ? `/${row.provider}` : ""}]`);
    });
  }
}

async function run() {
  console.log("Seeding demo employer AI data for Aktau City Jobs Hub...");

  try {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const employer = await ensureEmployer(passwordHash);

    const createdVacancies = [];
    for (const vacancy of demoVacancies) {
      createdVacancies.push(await upsertVacancy(employer.id, vacancy));
    }

    const createdSeekers = [];
    for (const seeker of demoSeekers) {
      createdSeekers.push(await upsertSeeker(passwordHash, seeker));
    }

    await clearDemoApplications(
      createdSeekers.map((seeker) => seeker.id),
      createdVacancies.map((vacancy) => vacancy.id)
    );

    await warmMatches(
      employer.id,
      createdVacancies.map((vacancy) => vacancy.id)
    );

    console.log(`Employer ready: ${EMPLOYER_EMAIL}`);
    console.log(`Demo password for seeded seekers/employer: ${DEMO_PASSWORD}`);
    console.log(`Vacancies ensured: ${createdVacancies.length}`);
    console.log(`Demo seekers ensured: ${createdSeekers.length}`);
    await printTopMatches(createdVacancies.map((vacancy) => vacancy.id));
  } catch (error) {
    console.error("Error seeding demo employer AI data:", error);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

run();
