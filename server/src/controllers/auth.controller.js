const bcrypt = require("bcryptjs");
const db = require("../db/knex");
const { signToken } = require("../utils/auth");
const { sanitizeUser } = require("../utils/responses");

function normalizeTelegramUsername(value) {
  return value ? value.replace(/^@/, "").trim() : null;
}

async function register(req, res) {
  try {
    const {
      full_name: rawFullName,
      contact_name: rawContactName,
      company_name: rawCompanyName,
      name,
      email,
      password,
      role,
      telegram_username: rawTelegramUsername
    } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Заполните email, пароль и роль." });
    }

    if (!["seeker", "employer"].includes(role)) {
      return res.status(400).json({ message: "Некорректная роль пользователя." });
    }

    const telegramUsername = normalizeTelegramUsername(rawTelegramUsername);
    const fullName = (rawFullName || name || "").trim();
    const contactName = (rawContactName || name || "").trim();
    const companyName = (rawCompanyName || "").trim();

    if (!telegramUsername) {
      return res.status(400).json({ message: "Telegram username обязателен для регистрации." });
    }

    if (role === "seeker" && !fullName) {
      return res.status(400).json({ message: "Укажите ваше имя и фамилию." });
    }

    if (role === "employer" && (!contactName || !companyName)) {
      return res.status(400).json({ message: "Для работодателя нужны имя контакта и название компании." });
    }

    const existingUser = await db("users").whereRaw("LOWER(email) = LOWER(?)", [email]).first();
    if (existingUser) {
      return res.status(409).json({ message: "Пользователь с таким email уже существует." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db("users")
      .insert({
        name: role === "employer" ? contactName : fullName,
        full_name: role === "seeker" ? fullName : null,
        contact_name: role === "employer" ? contactName : null,
        company_name: role === "employer" ? companyName : null,
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
        role,
        telegram_username: telegramUsername
      })
      .returning([
        "id",
        "role",
        "name",
        "full_name",
        "contact_name",
        "company_name",
        "email",
        "telegram_username",
        "telegram_chat_id",
        "created_at"
      ]);

    const token = signToken(user);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error("register error", error);
    return res.status(500).json({ message: "Не удалось зарегистрировать пользователя." });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Введите email и пароль." });
    }

    const user = await db("users").whereRaw("LOWER(email) = LOWER(?)", [email]).first();
    if (!user) {
      return res.status(401).json({ message: "Неверный email или пароль." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Неверный email или пароль." });
    }

    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error("login error", error);
    return res.status(500).json({ message: "Не удалось выполнить вход." });
  }
}

async function me(req, res) {
  return res.json({ user: sanitizeUser(req.user) });
}

async function logout(_, res) {
  return res.json({ message: "Выход выполнен." });
}

module.exports = { register, login, me, logout };
