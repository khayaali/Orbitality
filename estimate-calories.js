/* =====================================================================
   ORBIT — calorie estimator (Netlify Function)
   ---------------------------------------------------------------------
   The app POSTs { text: "2 rotis, dal and rice" } to this endpoint and
   gets back { kcal, items, provider }. The API key stays here on the
   server (a Netlify environment variable) and is NEVER shipped to the
   browser.

   Configure exactly ONE provider by setting env vars in Netlify
   (Site settings → Environment variables), then redeploy:

     Option A — RECOMMENDED (best for casual notes + Indian/regional food):
       ANTHROPIC_API_KEY = sk-ant-...

     Option B — Nutritionix (dedicated nutrition database):
       NUTRITIONIX_APP_ID  = ...
       NUTRITIONIX_APP_KEY = ...

     Option C — API Ninjas Nutrition (formerly CalorieNinjas):
       API_NINJAS_KEY = ...

   If none is set, this returns 501 and the app quietly falls back to
   manual calorie entry.
   ===================================================================== */

const JSONH = { "Content-Type": "application/json" };

// Cheap + fast. Change if you prefer another model.
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST")
    return resp(405, { error: "POST only" });

  let text = "";
  try { text = String(JSON.parse(event.body || "{}").text || "").slice(0, 500).trim(); } catch (e) {}
  if (!text) return resp(400, { error: "no text" });

  try {
    if (process.env.ANTHROPIC_API_KEY)
      return resp(200, await viaAnthropic(text));
    if (process.env.NUTRITIONIX_APP_ID && process.env.NUTRITIONIX_APP_KEY)
      return resp(200, await viaNutritionix(text));
    if (process.env.API_NINJAS_KEY)
      return resp(200, await viaApiNinjas(text));
    return resp(501, { error: "No estimator configured. Add an API key in Netlify env vars." });
  } catch (e) {
    return resp(502, { error: "Estimator failed: " + (e && e.message ? e.message : "unknown") });
  }
};

function resp(statusCode, payload) {
  return { statusCode, headers: JSONH, body: JSON.stringify(payload) };
}

/* ---------- Option A: Claude ---------- */
async function viaAnthropic(text) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 200,
      system:
        "You are a nutrition estimator. Given a short, casual description of a meal, " +
        "estimate its most likely TOTAL calories, assuming typical portion sizes and " +
        "accounting for regional and Indian dishes. Reply with ONLY compact JSON and no " +
        'markdown: {"kcal": <integer>, "items": ["..."], "confidence": "low|medium|high"}.',
      messages: [{ role: "user", content: text }]
    })
  });
  if (!r.ok) throw new Error("anthropic " + r.status);
  const d = await r.json();
  const raw = (d.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
  const j = JSON.parse(raw.replace(/```json|```/g, "").trim());
  return {
    kcal: Math.round(Number(j.kcal)),
    items: Array.isArray(j.items) ? j.items : [],
    confidence: j.confidence || null,
    provider: "Claude"
  };
}

/* ---------- Option B: Nutritionix natural-language ---------- */
async function viaNutritionix(text) {
  const r = await fetch("https://trackapi.nutritionix.com/v2/natural/nutrients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-id": process.env.NUTRITIONIX_APP_ID,
      "x-app-key": process.env.NUTRITIONIX_APP_KEY
    },
    body: JSON.stringify({ query: text })
  });
  if (!r.ok) throw new Error("nutritionix " + r.status);
  const d = await r.json();
  const foods = d.foods || [];
  const kcal = foods.reduce((a, f) => a + (f.nf_calories || 0), 0);
  return { kcal: Math.round(kcal), items: foods.map(f => f.food_name), provider: "Nutritionix" };
}

/* ---------- Option C: API Ninjas Nutrition ---------- */
async function viaApiNinjas(text) {
  const r = await fetch(
    "https://api.api-ninjas.com/v1/nutrition?query=" + encodeURIComponent(text),
    { headers: { "X-Api-Key": process.env.API_NINJAS_KEY } }
  );
  if (!r.ok) throw new Error("apininjas " + r.status);
  const arr = await r.json();
  const list = Array.isArray(arr) ? arr : [];
  const kcal = list.reduce((a, f) => a + (f.calories || 0), 0);
  return { kcal: Math.round(kcal), items: list.map(f => f.name), provider: "API Ninjas" };
}
