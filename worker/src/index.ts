interface Env {
  DB: D1Database;
  API_KEY: string;
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;
}

interface SuggestRequest {
  remaining: { kcal: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number };
  time: string;
  is_gym_day: boolean;
  meals_today: string[];
  foods: Array<{
    id: string;
    name: string;
    group: string;
    defaultWeight_g: number;
    kcalPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
  }>;
}

interface Suggestion {
  foodId: string;
  name: string;
  weight_g: number;
  reason: string;
}

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  foods: Array<{ id: string; name: string; defaultWeight_g: number }>;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function err(msg: string, status: number): Response {
  return json({ error: msg }, status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const key = request.headers.get("X-Api-Key");
    if (key !== env.API_KEY) {
      return err("Unauthorized", 401);
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // /api/meals
    if (path === "/api/meals") {
      if (method === "GET") {
        const date = url.searchParams.get("date");
        if (!date) return err("date required", 400);
        const rows = await env.DB.prepare(
          "SELECT id, date, time, items, totals FROM meals WHERE date = ? ORDER BY time DESC"
        ).bind(date).all();
        const meals = rows.results.map((r) => ({
          id: r.id,
          date: r.date,
          time: r.time,
          items: JSON.parse(r.items as string),
          totals: JSON.parse(r.totals as string),
        }));
        return json(meals);
      }

      if (method === "POST") {
        const meal = await request.json() as {
          id: string;
          date: string;
          time: string;
          items: unknown;
          totals: unknown;
        };
        await env.DB.prepare(
          "INSERT INTO meals (id, date, time, items, totals) VALUES (?, ?, ?, ?, ?)"
        ).bind(meal.id, meal.date, meal.time, JSON.stringify(meal.items), JSON.stringify(meal.totals)).run();
        return json({ ok: true });
      }
    }

    // /api/meals/:id
    const mealMatch = path.match(/^\/api\/meals\/([^/]+)$/);
    if (mealMatch) {
      const id = mealMatch[1];

      if (method === "PUT") {
        const patch = await request.json() as {
          time: string;
          items: unknown;
          totals: unknown;
        };
        await env.DB.prepare(
          "UPDATE meals SET time = ?, items = ?, totals = ? WHERE id = ?"
        ).bind(patch.time, JSON.stringify(patch.items), JSON.stringify(patch.totals), id).run();
        return json({ ok: true });
      }

      if (method === "DELETE") {
        await env.DB.prepare("DELETE FROM meals WHERE id = ?").bind(id).run();
        return json({ ok: true });
      }
    }

    // /api/gym-day
    if (path === "/api/gym-day") {
      if (method === "GET") {
        const row = await env.DB.prepare(
          "SELECT active, date FROM gym_day WHERE id = 1"
        ).first<{ active: number; date: string }>();
        return json({ active: row ? Boolean(row.active) : false, date: row?.date ?? "" });
      }

      if (method === "PUT") {
        const body = await request.json() as { active: boolean; date: string };
        await env.DB.prepare(
          "INSERT OR REPLACE INTO gym_day (id, active, date) VALUES (1, ?, ?)"
        ).bind(body.active ? 1 : 0, body.date).run();
        return json({ ok: true });
      }
    }

    // /api/suggest
    if (path === "/api/suggest" && method === "POST") {
      const body = await request.json() as SuggestRequest;

      const foodLines = body.foods
        .map((f) => `${f.id}|${f.name}|${f.group}|${f.defaultWeight_g}g|${f.kcalPer100g}kcal|${f.proteinPer100g}gP|${f.carbsPer100g}gC|${f.fatPer100g}gF`)
        .join("\n");

      const alreadyEaten = body.meals_today.length > 0
        ? body.meals_today.join(", ")
        : "nothing yet";

      const prompt = `You are a nutrition assistant. Suggest 3-5 foods to eat next based on remaining macro targets.

Remaining macros for today:
- Calories: ${Math.round(body.remaining.kcal)} kcal
- Protein: ${Math.round(body.remaining.protein)}g
- Carbs: ${Math.round(body.remaining.carbs)}g
- Fat: ${Math.round(body.remaining.fat)}g

Current time: ${body.time}
Gym day: ${body.is_gym_day ? "yes" : "no"}
Already eaten today: ${alreadyEaten}

Available foods (id|name|group|default_g|kcal/100g|protein/100g|carbs/100g|fat/100g):
${foodLines}

Respond ONLY with valid JSON, no explanation:
{"suggestions":[{"foodId":"...","name":"...","weight_g":N,"reason":"..."}]}

Rules:
- weight_g should be close to default_g (reasonable portion)
- reason must be in Spanish, max 8 words, focus on which macro it helps
- prioritize foods that fill the largest remaining macro gaps
- if remaining kcal <= 200, suggest only 1-2 light options
- do not suggest foods from group "❌ Eliminado"`;

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 512,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!resp.ok) return err("Anthropic API error", 502);

      const aiResp = await resp.json() as { content: Array<{ text: string }> };
      const text = aiResp.content[0]?.text ?? "{}";

      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return err("Invalid AI response", 502);

      const parsed = JSON.parse(match[0]) as { suggestions: Suggestion[] };
      return json(parsed.suggestions ?? []);
    }

    // /api/chat
    if (path === "/api/chat" && method === "POST") {
      const body = await request.json() as ChatRequest;

      const foodLines = body.foods
        .map((f) => `${f.id}|${f.name}|${f.defaultWeight_g}g`)
        .join("\n");

      const systemPrompt = `You are a nutrition logging assistant. The user describes what they ate. Match their input to foods from the list below and return structured data.

Available foods (id|name|defaultWeight_g):
${foodLines}

Rules:
- Match fuzzy: "pollo" → pechuga_pollo, "huevos" → huevo, "avena" → avena
- If count given (e.g. "2 huevos"): weight_g = count * defaultWeight_g
- If weight given (e.g. "150g de pollo"): use that weight
- If neither: use defaultWeight_g
- If a food cannot be matched: ask for clarification in Spanish (max 15 words)
- Respond ONLY with valid JSON, no markdown:
  {"type":"items","items":[{"foodId":"...","name":"...","weight_g":N},...]}
  OR
  {"type":"message","text":"..."}`;

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 512,
          system: systemPrompt,
          messages: body.messages,
        }),
      });

      if (!resp.ok) return err("Anthropic API error", 502);

      const aiResp = await resp.json() as { content: Array<{ text: string }> };
      const text = aiResp.content[0]?.text ?? "{}";

      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return json({ type: "message", text: "No entendí. Intenta de nuevo." });

      try {
        return json(JSON.parse(match[0]));
      } catch {
        return json({ type: "message", text: "No entendí. Intenta de nuevo." });
      }
    }

    // /api/transcribe
    if (path === "/api/transcribe" && method === "POST") {
      const audioBuffer = await request.arrayBuffer();
      const contentType = request.headers.get("Content-Type") ?? "audio/webm";

      const formData = new FormData();
      formData.append("file", new Blob([audioBuffer], { type: contentType }), "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("language", "es");

      const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}` },
        body: formData,
      });

      if (!resp.ok) return err("Whisper API error", 502);

      const result = await resp.json() as { text: string };
      return json({ text: result.text });
    }

    return err("Not found", 404);
  },
};
