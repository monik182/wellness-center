export interface MacroResult {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
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

function computeSimilarity(query: string, productName: string): number {
  const dist = levenshtein(query.toLowerCase(), productName.toLowerCase());
  const maxLen = Math.max(query.length, productName.length);
  return 1 - dist / maxLen;
}

export async function fetchOpenFoodFacts(
  name: string
): Promise<{ result: MacroResult; displayName: string; default_weight_g?: number } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const query = encodeURIComponent(name);
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&page_size=5`;

    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": `CalorieTracker/1.0 (${Deno.env.get("AGENT")})`,
      },
    });

    if (resp.status !== 200) return null;

    const data = (await resp.json()) as {
      products?: Array<{
        product_name?: string;
        nutriments?: Record<string, number | undefined>;
        countries_tags?: string;
        code?: string;
        serving_size?: string;
      }>;
    };

    if (!data.products || data.products.length === 0) return null;

    // Find best product with valid macros and good name match
    let bestProduct: (typeof data.products)[0] | null = null;
    let bestScore = 0.7;

    for (const product of data.products) {
      if (!product.product_name) continue;

      const nutriments = product.nutriments || {};
      const kcal = nutriments["energy-kcal_100g"];
      const protein = nutriments["proteins_100g"];
      const carbs = nutriments["carbohydrates_100g"];
      const fat = nutriments["fat_100g"];

      if (typeof kcal !== "number" || typeof protein !== "number" || typeof carbs !== "number" || typeof fat !== "number") {
        continue;
      }

      let similarity = computeSimilarity(name, product.product_name);

      // Prefer Spain origins
      if (product.countries_tags && product.countries_tags.includes("spain")) {
        similarity = Math.min(1, similarity + 0.1);
      }

      if (similarity > bestScore) {
        bestScore = similarity;
        bestProduct = product;
      }
    }

    if (!bestProduct || !bestProduct.product_name) return null;

    const nutriments = bestProduct.nutriments!;

    let default_weight_g: number | undefined;
    const servingRaw = bestProduct.serving_size;
    if (servingRaw) {
      const match = servingRaw.match(/(\d+(?:\.\d+)?)/);
      if (match) default_weight_g = parseFloat(match[1]);
    }

    return {
      displayName: bestProduct.product_name,
      result: {
        kcal: nutriments["energy-kcal_100g"]!,
        protein: nutriments["proteins_100g"]!,
        carbs: nutriments["carbohydrates_100g"]!,
        fat: nutriments["fat_100g"]!,
        fiber: nutriments["fiber_100g"] ?? 0,
      },
      default_weight_g,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
