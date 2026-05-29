import { normalizeFoodName } from "./utils/normalizeFoodName";
import { HARDCODED_FOODS } from "./hardcodedFoods";
import { fetchOpenFoodFacts, type MacroResult } from "./providers/openFoodFacts";
import { estimateWithHaiku } from "./providers/haiku";

export interface ResolveRequest {
  name: string;
  weight_g: number;
}

export interface ResolveResponse {
  name: string;
  weight_g: number;
  source: "hardcoded" | "off" | "haiku";
  per_100g: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  macros: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function matchHardcoded(normalized: string) {
  let best = null;
  let bestDist = 3; // must be < 3 (i.e., <= 2)

  for (const food of HARDCODED_FOODS) {
    for (const alias of food.names) {
      const dist = levenshtein(normalized, alias);
      if (dist < bestDist) {
        bestDist = dist;
        best = food;
      }
    }
  }

  return best;
}

async function writeToCache(
  key: string,
  name: string,
  source: string,
  macros: MacroResult,
  db: D1Database
): Promise<void> {
  await db
    .prepare(
      "INSERT OR REPLACE INTO foods_cache (key, name, source, kcal, protein, carbs, fat, fiber, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(
      key,
      name,
      source,
      macros.kcal,
      macros.protein,
      macros.carbs,
      macros.fat,
      macros.fiber,
      new Date().toISOString()
    )
    .run();
}

function scaleToWeight(per100g: MacroResult, weight_g: number) {
  return {
    kcal: Math.round((per100g.kcal / 100) * weight_g * 10) / 10,
    protein: Math.round((per100g.protein / 100) * weight_g * 10) / 10,
    carbs: Math.round((per100g.carbs / 100) * weight_g * 10) / 10,
    fat: Math.round((per100g.fat / 100) * weight_g * 10) / 10,
    fiber: Math.round((per100g.fiber / 100) * weight_g * 10) / 10,
  };
}

export async function resolveNutrition(
  req: ResolveRequest,
  env: { DB: D1Database; ANTHROPIC_API_KEY: string }
): Promise<ResolveResponse> {
  const normalized = normalizeFoodName(req.name);

  // Step 1: Hardcoded foods
  const hardcoded = matchHardcoded(normalized);
  if (hardcoded) {
    const per_100g: MacroResult = {
      kcal: hardcoded.kcal,
      protein: hardcoded.protein,
      carbs: hardcoded.carbs,
      fat: hardcoded.fat,
      fiber: hardcoded.fiber,
    };
    return {
      name: hardcoded.name,
      weight_g: req.weight_g,
      source: "hardcoded",
      per_100g,
      macros: scaleToWeight(per_100g, req.weight_g),
    };
  }

  // Step 2: D1 cache check
  const cacheRow = await env.DB.prepare(
    "SELECT name, source, kcal, protein, carbs, fat, fiber FROM foods_cache WHERE key = ?"
  ).bind(normalized).first<{
    name: string;
    source: string;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }>();

  if (cacheRow) {
    const per_100g: MacroResult = {
      kcal: cacheRow.kcal,
      protein: cacheRow.protein,
      carbs: cacheRow.carbs,
      fat: cacheRow.fat,
      fiber: cacheRow.fiber,
    };
    return {
      name: cacheRow.name,
      weight_g: req.weight_g,
      source: (cacheRow.source as "off" | "haiku") || "haiku",
      per_100g,
      macros: scaleToWeight(per_100g, req.weight_g),
    };
  }

  // Step 3: Open Food Facts
  const offResult = await fetchOpenFoodFacts(req.name);
  if (offResult) {
    await writeToCache(normalized, offResult.displayName, "off", offResult.result, env.DB);
    return {
      name: offResult.displayName,
      weight_g: req.weight_g,
      source: "off",
      per_100g: offResult.result,
      macros: scaleToWeight(offResult.result, req.weight_g),
    };
  }

  // Step 4: Haiku (guaranteed to return something)
  const haikuResult = await estimateWithHaiku(req.name, env.ANTHROPIC_API_KEY);
  await writeToCache(normalized, req.name, "haiku", haikuResult, env.DB);

  return {
    name: req.name,
    weight_g: req.weight_g,
    source: "haiku",
    per_100g: haikuResult,
    macros: scaleToWeight(haikuResult, req.weight_g),
  };
}
