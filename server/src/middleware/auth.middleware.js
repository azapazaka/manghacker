const jwt = require("jsonwebtoken");
const env = require("../config/env");
const db = require("../db/knex");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Требуется авторизация." });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await db("users").where({ id: payload.sub }).first();

    if (!user) {
      return res.status(401).json({ message: "Пользователь не найден." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Недействительный токен." });
  }
}

module.exports = { requireAuth };
