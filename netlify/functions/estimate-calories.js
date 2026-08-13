  exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "POST only" }) };
  }

  let text = "";
  try {
    const body = JSON.parse(event.body || "{}");
    text = String(body.text || "").slice(0, 500).trim();
  } catch (e) {}

  if (!text) {
    return { statusCode: 400, body: JSON.stringify({ error: "no text" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 501, body: JSON.stringify({ error: "API key not configured" }) };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: "You are a nutrition estimator. Given a meal description, estimate TOTAL calories. Reply ONLY with JSON: {\"kcal\": <number>}",
        messages: [{ role: "user", content: text }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API returned ${response.status}`);
    }

    const data = await response.json();
    const content = (data.content || []).find(b => b.type === "text")?.text || "";
    const json = JSON.parse(content.replace(/```json|```/g, "").trim());

    return {
      statusCode: 200,
      body: JSON.stringify({
        kcal: Math.round(Number(json.kcal)),
        provider: "Claude"
      })
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: error.message || "Estimator failed" })
    };
  }
};
