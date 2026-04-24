const { getRecommendations, refreshRecommendations } = require("../services/match.service");

async function getMyRecommendations(req, res) {
  try {
    const matches = await getRecommendations(req.user.id);
    return res.json({ data: matches });
  } catch (error) {
    console.error("getMyRecommendations error", error);
    return res.status(500).json({ message: "Не удалось получить AI-рекомендации." });
  }
}

async function refreshMyRecommendations(req, res) {
  try {
    const matches = await refreshRecommendations(req.user.id, { force: true });
    return res.json({ data: matches, message: "AI-рекомендации обновлены." });
  } catch (error) {
    console.error("refreshMyRecommendations error", error);
    return res.status(500).json({ message: "Не удалось пересчитать AI-рекомендации." });
  }
}

module.exports = { getMyRecommendations, refreshMyRecommendations };
