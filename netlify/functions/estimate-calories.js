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
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: `Estimate the total calories in this meal. Reply ONLY with JSON like {"kcal": 350}. Meal: ${text}`
          }
        ]
      })
    });

    const responseText = await response.text();
    console.log("API Response:", response.status, responseText);

    if (!response.ok) {
      throw new Error(`API ${response.status}: ${responseText}`);
    }

    const data = JSON.parse(responseText);
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
