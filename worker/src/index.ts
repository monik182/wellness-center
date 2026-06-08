import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { resolveNutrition } from "./resolver";

interface Env {
  DB: D1Database;
  API_KEY: string;
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;
  OFF_COOKIE: string;
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
  messages: Array<{
    role: "user" | "assistant";
    content: string | Array<{
      type: "text" | "image";
      text?: string;
      source?: {
        type: "base64";
        media_type: string;
        data: string;
      };
    }>;
    toolInvocations?: unknown[];
  }>;
  foods: Array<{ id: string; name: string; defaultWeight_g: number }>;
}

interface DetectImageRequest {
  image: string;
  mimeType: string;
  foods: Array<{ id: string; name: string; group: string }>;
}

interface DetectedItem {
  name: string;
  weight_g: number;
  confidence: number;
  reasoning: string;
}

interface DetectImageResponse {
  success: boolean;
  detected_items?: DetectedItem[];
  confidence_summary?: string;
  warnings?: string[];
  error?: string;
}

interface NutritionLabelExtractionRequest {
  image: string;
  mimeType: string;
}

interface NutritionLabelData {
  product_name: string;
  serving_size?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  sugar_g: number;
  fat_g: number;
  saturated_fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  confidence: number;
  notes: string;
  warnings: string[];
}

interface CustomFood {
  id: string;
  name: string;
  serving_size?: string;
  serving_size_g?: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  sugar_g: number;
  fat_g: number;
  saturated_fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  source: string;
  created_at: string;
}

interface CustomFoodInput {
  name: string;
  serving_size?: string;
  serving_size_g?: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  sugar_g: number;
  fat_g: number;
  saturated_fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
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

    // /api/meals/history?before=YYYY-MM-DD&limit=N
    if (path === "/api/meals/history" && method === "GET") {
      const before = url.searchParams.get("before") ?? "9999-12-31";
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "14", 10), 60);
      const rows = await env.DB.prepare(
        "SELECT id, date, time, items, totals FROM meals WHERE date < ? ORDER BY date DESC, time DESC LIMIT ?"
      ).bind(before, limit).all();
      const meals = rows.results.map((r) => ({
        id: r.id,
        date: r.date,
        time: r.time,
        items: JSON.parse(r.items as string),
        totals: JSON.parse(r.totals as string),
      }));
      return json(meals);
    }

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

      const systemPrompt = `You are a nutrition logging assistant. The user describes what they ate or shows you a photo. Identify food items and call the logFood tool with structured data.

Available foods (id|name|defaultWeight_g):
${foodLines}

Rules for food identification:
- Match fuzzy: "pollo" → pechuga_pollo, "huevos" → huevo, "avena" → avena
- If count given (e.g. "2 huevos"): weight_g = count * defaultWeight_g
- If weight given (e.g. "150g de pollo"): use that weight
- If neither: use defaultWeight_g
- If a food cannot be matched, use its name as foodId
- If user is uncertain about weight (says "no sé", "estoy insegura", etc): use the food's defaultWeight_g
- If user asks questions unrelated to food: respond with a helpful message (do not call tool)
- If user shows a photo: analyze it and identify visible foods, estimate weights

When you identify food items, ALWAYS call the logFood tool. Do not respond with JSON text.
For non-food messages or questions, respond with text only (do not call tool).`;

      const anthropicProvider = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });

      const result = await streamText({
        model: anthropicProvider("claude-haiku-4-5-20251001"),
        system: systemPrompt,
        messages: body.messages as any,
        tools: {
          logFood: {
            description:
              "Call this when you have identified food items to log from the conversation or image.",
            parameters: z.object({
              items: z.array(
                z.object({
                  foodId: z.string().describe('id from the foods list, or the food name if not in list (e.g. "unknown")'),
                  name: z.string().describe("Food name in Spanish"),
                  weight_g: z.number().describe("Weight in grams"),
                })
              ),
            }),
          },
        },
        maxSteps: 1,
      });

      return result.toDataStreamResponse({
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
        },
      });
    }

    // /api/analyze-image
    if (path === "/api/analyze-image" && method === "POST") {
      const body = await request.json() as {
        image?: unknown;
        mimeType?: unknown;
        foods?: unknown;
      };

      if (!body.image || typeof body.image !== "string") {
        return err("image is required", 400);
      }

      if (!body.mimeType || typeof body.mimeType !== "string") {
        return err("mimeType is required", 400);
      }

      const base64Bytes = body.image.length * 0.75;
      if (base64Bytes > 10 * 1024 * 1024) {
        return err("Image too large (10 MB max)", 400);
      }

      const validMimes = ["image/jpeg", "image/png", "image/webp"];
      if (!validMimes.includes(body.mimeType)) {
        return err("Invalid image format. Use JPEG, PNG, or WebP.", 400);
      }

      // Classify image type
      const classifyResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20250101",
          max_tokens: 10,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: body.mimeType,
                    data: body.image,
                  },
                },
                {
                  type: "text",
                  text: 'Is this (A) a photo of food/meal, (B) a nutrition label/ingredient list on packaging, or (C) a barcode? Reply with ONLY the letter (A, B, or C) and nothing else.',
                },
              ],
            },
          ],
        }),
      });

      if (!classifyResp.ok) {
        return json({ type: "barcode", message: "Error al procesar la imagen." }, 502);
      }

      const classifyData = await classifyResp.json() as { content: Array<{ text: string }> };
      const classifyText = (classifyData.content[0]?.text ?? "").trim().toUpperCase();

      // Route based on classification
      if (classifyText.includes("A")) {
        // Food detection - reuse existing logic
        const foods = Array.isArray(body.foods) ? body.foods : [];
        const foodLines = (foods as any[])
          .map((f) => `${f.id}|${f.name}`)
          .join("\n");

        const prompt = `You are a food identification AI. Analyze this meal photo and identify each distinct food item visible. For each item, estimate its weight in grams.

Available foods you can match to (id|name):
${foodLines}

Return ONLY valid JSON in this format (no markdown, no explanation):
{
  "detected_items": [
    {
      "name": "Food name (use Spanish names from the list if possible, or best match)",
      "weight_g": 150,
      "confidence": 0.95,
      "reasoning": "Brief description of visual cues"
    }
  ],
  "confidence_summary": "Overall confidence assessment",
  "warnings": ["Any ambiguities or uncertainties"]
}

Rules:
- Only identify items clearly visible
- Use weights between 50-500g per item
- confidence: 0.8-1.0 scale
- If no food is visible, return empty detected_items array
- Match food names to the available foods list when possible
- Be conservative: if uncertain, lower the confidence score`;

        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: body.mimeType,
                      data: body.image,
                    },
                  },
                  {
                    type: "text",
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        });

        if (!resp.ok) {
          return json({ type: "food", success: false, error: "Claude API error" }, 502);
        }

        const aiResp = await resp.json() as { content: Array<{ text: string }> };
        const text = aiResp.content[0]?.text ?? "{}";
        const match = text.match(/\{[\s\S]*\}/);

        if (!match) {
          return json({ type: "food", success: false, error: "Unable to parse response" }, 502);
        }

        try {
          const parsed = JSON.parse(match[0]) as {
            detected_items: DetectedItem[];
            confidence_summary: string;
            warnings: string[];
          };

          if (!Array.isArray(parsed.detected_items)) {
            return json({ type: "food", success: false, error: "Invalid response format" }, 502);
          }

          return json({
            type: "food",
            success: true,
            detected_items: parsed.detected_items,
            confidence_summary: parsed.confidence_summary,
            warnings: parsed.warnings || [],
          });
        } catch {
          return json({ type: "food", success: false, error: "Unable to parse response" }, 502);
        }
      } else if (classifyText.includes("B")) {
        // Nutrition label - reuse existing logic
        const labelCheckResp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 10,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: body.mimeType,
                      data: body.image,
                    },
                  },
                  {
                    type: "text",
                    text: "Is this image a nutrition facts label, nutrition information table, or nutritional data from food packaging? Answer only 'yes' or 'no'.",
                  },
                ],
              },
            ],
          }),
        });

        if (!labelCheckResp.ok) {
          return json({ type: "label", success: false, error: "Label validation failed" }, 502);
        }

        const labelCheckAiResp = await labelCheckResp.json() as { content: Array<{ text: string }> };
        const labelCheckText = (labelCheckAiResp.content[0]?.text ?? "").toLowerCase();

        if (!labelCheckText.includes("yes")) {
          return json({ type: "label", success: false, error: "not_a_label" }, 400);
        }

        // Extract nutrition data
        const extractionPrompt = `Extract nutritional information from this Nutrition Facts label image.

Return ONLY a JSON object in this exact format (no markdown, no explanation):

{
  "product_name": "String (required, e.g., 'Greek Yogurt Vanilla')",
  "serving_size": "String (optional, e.g., '1 container (150g)')",
  "calories": 130,
  "protein_g": 12,
  "carbs_g": 8,
  "sugar_g": 5,
  "fat_g": 6,
  "saturated_fat_g": 2,
  "fiber_g": null,
  "sodium_mg": null,
  "confidence": 0.95,
  "notes": "Clear label, standard US format",
  "warnings": []
}

Rules:
- All numeric values must be numbers, not strings
- Use null for missing/unclear values
- Product name is REQUIRED
- Calories, Protein, Carbs, Sugar, Fat are REQUIRED
- Include confidence score (0.0-1.0)
- If values are unclear or format is unusual, include in 'warnings'
- If label lists multiple servings, use the first/default serving
- Always include the extracted serving size description
- Convert all measurements to grams/mg if possible
- If nutritional values are per 100g and not per serving, note this in 'warnings'`;

        const extractResp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 512,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: body.mimeType,
                      data: body.image,
                    },
                  },
                  {
                    type: "text",
                    text: extractionPrompt,
                  },
                ],
              },
            ],
          }),
        });

        if (!extractResp.ok) {
          return json({ type: "label", success: false, error: "Claude API error" }, 502);
        }

        const extractAiResp = await extractResp.json() as { content: Array<{ text: string }> };
        const extractText = extractAiResp.content[0]?.text ?? "{}";
        const match = extractText.match(/\{[\s\S]*\}/);

        if (!match) {
          return json({ type: "label", success: false, error: "parse_error" }, 400);
        }

        try {
          const extracted = JSON.parse(match[0]) as Partial<NutritionLabelData>;
          return json({
            type: "label",
            success: true,
            extracted,
            warnings: extracted.warnings || [],
          });
        } catch {
          return json({ type: "label", success: false, error: "Unable to parse response" }, 502);
        }
      } else if (classifyText.includes("C")) {
        // Barcode: extract code and lookup
        const barcodePrompt =
          "Read the barcode or QR code number in this image. Return only the numeric digits or code (e.g., 8717345039622 or 5901234123457). If you cannot read the code, respond with 'ERROR'.";

        const barcodeReadResp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 50,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: body.mimeType,
                      data: body.image,
                    },
                  },
                  {
                    type: "text",
                    text: barcodePrompt,
                  },
                ],
              },
            ],
          }),
        });

        if (!barcodeReadResp.ok) {
          return json({ type: "barcode", found: false, code: null, error: "Claude API error" }, 502);
        }

        const barcodeReadData = await barcodeReadResp.json() as { content: Array<{ text: string }> };
        const barcodeCode = (barcodeReadData.content[0]?.text ?? "").trim();

        if (barcodeCode === "ERROR" || !barcodeCode) {
          return json({ type: "barcode", found: false, code: barcodeCode || null, message: "No se pudo leer el código de barras" });
        }

        // Lookup barcode via OFF
        try {
          const offResp = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcodeCode}.json`);
          if (!offResp.ok) {
            return json({ type: "barcode", found: false, code: barcodeCode, message: "Producto no encontrado en Open Food Facts" });
          }

          const offData = await offResp.json() as {
            product?: {
              product_name?: string;
              nutriments?: Record<string, number | undefined>;
            };
          };

          if (!offData.product) {
            return json({ type: "barcode", found: false, code: barcodeCode, message: "Producto no encontrado" });
          }

          const nutrients = offData.product.nutriments || {};
          const kcal = nutrients["energy-kcal"] || 0;
          const protein = nutrients["proteins"] || 0;
          const carbs = nutrients["carbohydrates"] || 0;
          const fat = nutrients["fat"] || 0;
          const fiber = nutrients["fiber"] || 0;
          const sugar = nutrients["sugars"] || 0;

          // Write to D1 cache
          const cacheKey = `${barcodeCode}`;
          const now = new Date().toISOString();
          await env.DB.prepare(`
            INSERT INTO foods_cache (key, name, source, kcal, protein, carbs, fat, fiber, sugar, fetched_at, default_weight_g, portion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
              name = excluded.name,
              source = excluded.source,
              kcal = excluded.kcal,
              protein = excluded.protein,
              carbs = excluded.carbs,
              fat = excluded.fat,
              fiber = excluded.fiber,
              sugar = excluded.sugar,
              fetched_at = excluded.fetched_at
          `).bind(cacheKey, offData.product.product_name || "Producto", "off_barcode", kcal, protein, carbs, fat, fiber, sugar, now, 100, "100g").run();

          return json({
            type: "barcode",
            found: true,
            code: barcodeCode,
            product: {
              name: offData.product.product_name || "Producto",
              kcal,
              protein,
              carbs,
              fat,
              fiber,
              sugar,
              per_100g: true,
              default_weight_g: 100,
            },
          });
        } catch (e) {
          return json({ type: "barcode", found: false, code: barcodeCode, error: String(e) }, 500);
        }
      } else {
        // Unknown classification
        return json({ type: "barcode", found: false, code: null, message: "No se pudo clasificar la imagen" });
      }
    }

    // /api/detect-image
    if (path === "/api/detect-image" && method === "POST") {
      const body = await request.json() as DetectImageRequest;

      const base64Bytes = body.image.length * 0.75;
      if (base64Bytes > 10 * 1024 * 1024) {
        return err("Image too large (10 MB max)", 400);
      }

      const validMimes = ["image/jpeg", "image/png", "image/webp"];
      if (!validMimes.includes(body.mimeType)) {
        return err("Invalid image format. Use JPEG, PNG, or WebP.", 400);
      }

      const foodLines = body.foods
        .map((f) => `${f.id}|${f.name}`)
        .join("\n");

      const prompt = `You are a food identification AI. Analyze this meal photo and identify each distinct food item visible. For each item, estimate its weight in grams.

Available foods you can match to (id|name):
${foodLines}

Return ONLY valid JSON in this format (no markdown, no explanation):
{
  "detected_items": [
    {
      "name": "Food name (use Spanish names from the list if possible, or best match)",
      "weight_g": 150,
      "confidence": 0.95,
      "reasoning": "Brief description of visual cues"
    }
  ],
  "confidence_summary": "Overall confidence assessment",
  "warnings": ["Any ambiguities or uncertainties"]
}

Rules:
- Only identify items clearly visible
- Use weights between 50-500g per item
- confidence: 0.8-1.0 scale
- If no food is visible, return empty detected_items array
- Match food names to the available foods list when possible
- Be conservative: if uncertain, lower the confidence score`;

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: body.mimeType,
                    data: body.image,
                  },
                },
                {
                  type: "text",
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!resp.ok) return err("Claude API error", 502);

      const aiResp = await resp.json() as { content: Array<{ text: string }> };
      const text = aiResp.content[0]?.text ?? "{}";

      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return json({ success: false, error: "Unable to parse response" }, 502);

      try {
        const parsed = JSON.parse(match[0]) as {
          detected_items: DetectedItem[];
          confidence_summary: string;
          warnings: string[];
        };

        if (!Array.isArray(parsed.detected_items)) {
          return json({ success: false, error: "Invalid response format" }, 502);
        }

        return json({
          success: true,
          detected_items: parsed.detected_items,
          confidence_summary: parsed.confidence_summary,
          warnings: parsed.warnings || [],
        });
      } catch {
        return json({ success: false, error: "Unable to parse response" }, 502);
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

    // /api/barcode/lookup
    if (path === "/api/barcode/lookup" && method === "POST") {
      const body = await request.json() as { code?: unknown };

      if (!body.code || typeof body.code !== "string" || body.code.trim() === "") {
        return err("code is required", 400);
      }

      const code = body.code.trim();

      try {
        const offResp = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
        if (!offResp.ok) {
          return json({ found: false, code, message: "Producto no encontrado en Open Food Facts" });
        }

        const offData = await offResp.json() as {
          product?: {
            product_name?: string;
            nutriments?: Record<string, number | undefined>;
          };
        };

        if (!offData.product) {
          return json({ found: false, code, message: "Producto no encontrado" });
        }

        const nutrients = offData.product.nutriments || {};
        const kcal = nutrients["energy-kcal"] || 0;
        const protein = nutrients["proteins"] || 0;
        const carbs = nutrients["carbohydrates"] || 0;
        const fat = nutrients["fat"] || 0;
        const fiber = nutrients["fiber"] || 0;
        const sugar = nutrients["sugars"] || 0;

        // Write to D1 cache
        const cacheKey = code;
        const now = new Date().toISOString();
        await env.DB.prepare(`
          INSERT INTO foods_cache (key, name, source, kcal, protein, carbs, fat, fiber, sugar, fetched_at, default_weight_g, portion)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET
            name = excluded.name,
            source = excluded.source,
            kcal = excluded.kcal,
            protein = excluded.protein,
            carbs = excluded.carbs,
            fat = excluded.fat,
            fiber = excluded.fiber,
            sugar = excluded.sugar,
            fetched_at = excluded.fetched_at
        `).bind(cacheKey, offData.product.product_name || "Producto", "off_barcode", kcal, protein, carbs, fat, fiber, sugar, now, 100, "100g").run();

        return json({
          found: true,
          code,
          product: {
            name: offData.product.product_name || "Producto",
            kcal,
            protein,
            carbs,
            fat,
            fiber,
            sugar,
            per_100g: true,
            default_weight_g: 100,
          },
        });
      } catch (e) {
        return json({ found: false, code, error: String(e) }, 500);
      }
    }

    // /api/nutrition/resolve
    if (path === "/api/nutrition/resolve" && method === "POST") {
      const body = await request.json() as { name?: unknown; weight_g?: unknown };

      if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
        return err("name is required", 400);
      }

      if (typeof body.weight_g !== "number" || body.weight_g <= 0) {
        return err("weight_g must be a positive number", 400);
      }

      try {
        const result = await resolveNutrition(
          { name: body.name, weight_g: body.weight_g },
          env
        );
        return json(result);
      } catch (e) {
        console.error("resolveNutrition failed:", e);
        return err("Failed to resolve nutrition data", 500);
      }
    }

    // /api/nutrition-labels/extract
    if (path === "/api/nutrition-labels/extract" && method === "POST") {
      const body = await request.json() as NutritionLabelExtractionRequest;

      if (!body.image || typeof body.image !== "string") {
        return err("image is required", 400);
      }

      if (!body.mimeType || typeof body.mimeType !== "string") {
        return err("mimeType is required", 400);
      }

      const base64Bytes = body.image.length * 0.75;
      if (base64Bytes > 10 * 1024 * 1024) {
        return err("Image too large (10 MB max)", 400);
      }

      const validMimes = ["image/jpeg", "image/png", "image/webp"];
      if (!validMimes.includes(body.mimeType)) {
        return err("Invalid image format. Use JPEG, PNG, or WebP.", 400);
      }

      // Label validation check
      const labelCheckResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 10,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: body.mimeType,
                    data: body.image,
                  },
                },
                {
                  type: "text",
                  text: "Is this image a nutrition facts label, nutrition information table, or nutritional data from food packaging? Answer only 'yes' or 'no'.",
                },
              ],
            },
          ],
        }),
      });

      if (!labelCheckResp.ok) {
        return json({ success: false, error: "Label validation failed" }, 502);
      }

      const labelCheckAiResp = await labelCheckResp.json() as { content: Array<{ text: string }> };
      const labelCheckText = (labelCheckAiResp.content[0]?.text ?? "").toLowerCase();
      if (!labelCheckText.includes("yes")) {
        return json({ success: false, error: "not_a_label" }, 400);
      }

      // Extract nutrition data
      const extractionPrompt = `Extract nutritional information from this Nutrition Facts label image.

Return ONLY a JSON object in this exact format (no markdown, no explanation):

{
  "product_name": "String (required, e.g., 'Greek Yogurt Vanilla')",
  "serving_size": "String (optional, e.g., '1 container (150g)')",
  "calories": 130,
  "protein_g": 12,
  "carbs_g": 8,
  "sugar_g": 5,
  "fat_g": 6,
  "saturated_fat_g": 2,
  "fiber_g": null,
  "sodium_mg": null,
  "confidence": 0.95,
  "notes": "Clear label, standard US format",
  "warnings": []
}

Rules:
- All numeric values must be numbers, not strings
- Use null for missing/unclear values
- Product name is REQUIRED
- Calories, Protein, Carbs, Sugar, Fat are REQUIRED
- Include confidence score (0.0-1.0)
- If values are unclear or format is unusual, include in 'warnings'
- If label lists multiple servings, use the first/default serving
- Always include the extracted serving size description
- Convert all measurements to grams/mg if possible
- If nutritional values are per 100g and not per serving, note this in 'warnings'`;

      const extractResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 512,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: body.mimeType,
                    data: body.image,
                  },
                },
                {
                  type: "text",
                  text: extractionPrompt,
                },
              ],
            },
          ],
        }),
      });

      if (!extractResp.ok) {
        return json({ success: false, error: "Claude API error" }, 502);
      }

      const extractAiResp = await extractResp.json() as { content: Array<{ text: string }> };
      const extractText = extractAiResp.content[0]?.text ?? "{}";

      const match = extractText.match(/\{[\s\S]*\}/);
      if (!match) {
        return json({ success: false, error: "parse_error" }, 400);
      }

      try {
        const extracted = JSON.parse(match[0]) as Partial<NutritionLabelData>;

        // Validate required fields
        const requiredFields: (keyof NutritionLabelData)[] = [
          "product_name",
          "calories",
          "protein_g",
          "carbs_g",
          "sugar_g",
          "fat_g",
        ];

        const missing = requiredFields.filter((f) => extracted[f] === null || extracted[f] === undefined);
        if (missing.length > 0) {
          return json(
            {
              success: false,
              error: `missing_fields`,
              missing_fields: missing,
              extracted,
            },
            400
          );
        }

        return json({
          success: true,
          product_name: extracted.product_name,
          serving_size: extracted.serving_size,
          calories: extracted.calories,
          protein_g: extracted.protein_g,
          carbs_g: extracted.carbs_g,
          sugar_g: extracted.sugar_g,
          fat_g: extracted.fat_g,
          saturated_fat_g: extracted.saturated_fat_g,
          fiber_g: extracted.fiber_g,
          sodium_mg: extracted.sodium_mg,
          confidence: extracted.confidence ?? 0.85,
          notes: extracted.notes ?? "",
          warnings: extracted.warnings ?? [],
        });
      } catch {
        return json({ success: false, error: "parse_error" }, 400);
      }
    }

    // /api/custom-foods (GET)
    if (path === "/api/custom-foods" && method === "GET") {
      const rows = await env.DB.prepare(
        "SELECT id, name, serving_size, serving_size_g, calories, protein_g, carbs_g, sugar_g, fat_g, saturated_fat_g, fiber_g, sodium_mg, source, created_at FROM custom_foods ORDER BY created_at DESC"
      ).all();

      const foods = (rows.results ?? []) as CustomFood[];
      return json({ success: true, foods });
    }

    // /api/custom-foods (POST)
    if (path === "/api/custom-foods" && method === "POST") {
      const body = await request.json() as CustomFoodInput;

      // Validate required fields
      if (!body.name || typeof body.name !== "string" || body.name.trim().length < 3) {
        return err("name is required (min 3 characters)", 400);
      }

      if (typeof body.calories !== "number" || body.calories < 0) {
        return err("calories must be a non-negative number", 400);
      }

      if (typeof body.protein_g !== "number" || body.protein_g < 0) {
        return err("protein_g must be a non-negative number", 400);
      }

      if (typeof body.carbs_g !== "number" || body.carbs_g < 0) {
        return err("carbs_g must be a non-negative number", 400);
      }

      if (typeof body.sugar_g !== "number" || body.sugar_g < 0) {
        return err("sugar_g must be a non-negative number", 400);
      }

      if (typeof body.fat_g !== "number" || body.fat_g < 0) {
        return err("fat_g must be a non-negative number", 400);
      }

      // Generate ID: random + slug from name
      const id = `custom-${crypto.randomUUID().slice(0, 8)}`;
      const now = new Date().toISOString();

      try {
        await env.DB.prepare(
          `INSERT INTO custom_foods (id, name, serving_size, serving_size_g, calories, protein_g, carbs_g, sugar_g, fat_g, saturated_fat_g, fiber_g, sodium_mg, source, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'nutrition_label_scan', ?)`
        ).bind(
          id,
          body.name.trim(),
          body.serving_size,
          body.serving_size_g,
          body.calories,
          body.protein_g,
          body.carbs_g,
          body.sugar_g,
          body.fat_g,
          body.saturated_fat_g,
          body.fiber_g,
          body.sodium_mg,
          now
        ).run();

        const food: CustomFood = {
          id,
          name: body.name.trim(),
          serving_size: body.serving_size,
          serving_size_g: body.serving_size_g,
          calories: body.calories,
          protein_g: body.protein_g,
          carbs_g: body.carbs_g,
          sugar_g: body.sugar_g,
          fat_g: body.fat_g,
          saturated_fat_g: body.saturated_fat_g,
          fiber_g: body.fiber_g,
          sodium_mg: body.sodium_mg,
          source: "nutrition_label_scan",
          created_at: now,
        };

        return json({ success: true, food });
      } catch (error) {
        // Check if it's a UNIQUE constraint violation
        if (error instanceof Error && error.message.includes("UNIQUE")) {
          return err("Food name already exists", 409);
        }
        return err("Database error", 500);
      }
    }

    return err("Not found", 404);
  },
};
