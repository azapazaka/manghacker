require("dotenv").config({ path: "../.env" });
const { requestOnboardingParse } = require("../src/services/llm.service");

async function run() {
  try {
    const res = await requestOnboardingParse([
      { role: "assistant", content: "Привет! Кем хочешь работать?" },
      { role: "user", content: "бариста" }
    ]);
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
