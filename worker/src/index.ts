interface Env {
  DB: D1Database;
  API_KEY: string;
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

    return err("Not found", 404);
  },
};
