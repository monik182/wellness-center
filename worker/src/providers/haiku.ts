import type { MacroResult } from "./openFoodFacts";

interface HaikuMacros {
  kcal_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
}

const FALLBACK_MACROS: MacroResult = {
  kcal: 100,
  protein: 5,
  carbs: 15,
  fat: 3,
  fiber: 1,
};

export async function estimateWithHaiku(name: string, apiKey: string): Promise<MacroResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const prompt = `Estimate the per-100g nutritional macros for the food: "${name}".
Return ONLY a valid JSON object with these keys (all numeric values in grams/kcal):
{
  "kcal_per_100g": <number>,
  "protein_per_100g": <number>,
  "carbs_per_100g": <number>,
  "fat_per_100g": <number>,
  "fiber_per_100g": <number or null>,
  "sugar_per_100g": <number or null>
}
This is a best-guess estimate. Use nutritional knowledge to provide reasonable values.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        system: "You are a nutritional data assistant. Return ONLY valid JSON, no other text.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (resp.status !== 200) {
      console.error(`Haiku API error: ${resp.status}`);
      return FALLBACK_MACROS;
    }

    const data = (await resp.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const textContent = data.content?.find((c) => c.type === "text")?.text;

    if (!textContent) {
      console.error("Haiku: no text content in response");
      return FALLBACK_MACROS;
    }

    // Extract JSON from response (handles case where Haiku wraps JSON in markdown)
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Haiku: no JSON found in response");
      return FALLBACK_MACROS;
    }

    const parsed = JSON.parse(jsonMatch[0]) as HaikuMacros;

    return {
      kcal: parsed.kcal_per_100g ?? 100,
      protein: parsed.protein_per_100g ?? 5,
      carbs: parsed.carbs_per_100g ?? 15,
      fat: parsed.fat_per_100g ?? 3,
      fiber: parsed.fiber_per_100g ?? 1,
    };
  } catch (e) {
    console.error("Haiku estimation failed:", e);
    return FALLBACK_MACROS;
  } finally {
    clearTimeout(timer);
  }
}
