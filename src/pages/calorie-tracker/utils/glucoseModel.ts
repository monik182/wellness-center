import type { GlucoseDataPoint, LoggedFoodItem } from "../types";

/**
 * Gaussian-like curve contribution for a single food item
 * @param t Time in minutes
 * @param center Peak time (center) in minutes
 * @param spread Standard deviation (width) of the curve
 * @param peak Maximum height (amplitude)
 */
function gaussianImpact(t: number, center: number, spread: number, peak: number): number {
  const exponent = -0.5 * Math.pow((t - center) / spread, 2);
  return peak * Math.exp(exponent);
}

/**
 * Calculate meal total GL (Carga Glucémica)
 */
export function calcMealGL(items: LoggedFoodItem[]): number {
  return items.reduce((sum, item) => {
    if (!item.gi) return sum;
    const netCarbs = Math.max(0, item.carbs - item.fiber);
    const gl = (item.gi * netCarbs) / 100;
    return sum + gl;
  }, 0);
}

/**
 * Check if item is protein/fiber-rich (for order adjustment logic)
 */
export function isProteinFiberRich(item: LoggedFoodItem): boolean {
  return item.protein >= 10 || item.fiber >= 3;
}

/**
 * Generate glucose impact curve for a meal
 * Returns data points for 0-240 min in 5-min intervals
 */
export function calcMealGlucoseCurve(
  items: LoggedFoodItem[],
  consumptionOrder?: number[]
): GlucoseDataPoint[] {
  const dataPoints: GlucoseDataPoint[] = [];

  // Check if order adjustment applies
  let orderAdjustmentFactor = 1;
  if (consumptionOrder && consumptionOrder.length >= 2 && items.length >= 2) {
    const firstItemIdx = consumptionOrder[0];
    const firstItem = items[firstItemIdx];

    // If first item is protein/fiber-rich, check if later items are high-GI
    if (firstItem && isProteinFiberRich(firstItem)) {
      const hasLaterHighGI = consumptionOrder
        .slice(1)
        .some((idx) => items[idx]?.gi && items[idx].gi! > 55);

      if (hasLaterHighGI) {
        orderAdjustmentFactor = 0.6; // 40% reduction
      }
    }
  }

  // Calculate contribution for each item
  const contributions: Array<{
    center: number;
    spread: number;
    peak: number;
    gi: number;
    isAdjusted: boolean;
  }> = [];

  items.forEach((item, itemIdx) => {
    if (!item.gi) return;

    const netCarbs = Math.max(0, item.carbs - item.fiber);
    const gl = (item.gi * netCarbs) / 100;

    // Determine peak time based on GI
    let center: number;
    let spread: number;
    if (item.gi < 55) {
      center = 52;
      spread = 35;
    } else if (item.gi < 70) {
      center = 37;
      spread = 25;
    } else {
      center = 25;
      spread = 18;
    }

    // Offset by consumption order (if provided)
    if (consumptionOrder) {
      const orderIdx = consumptionOrder.indexOf(itemIdx);
      if (orderIdx >= 0) {
        center += orderIdx * 5; // Stagger items by 5 min
      }
    }

    // Peak height proportional to GL
    let peak = gl * 2;

    // Apply order adjustment to high-GI items if applicable
    let isAdjusted = false;
    if (
      orderAdjustmentFactor === 0.6 &&
      consumptionOrder &&
      item.gi > 55 &&
      consumptionOrder[0] !== itemIdx
    ) {
      peak *= orderAdjustmentFactor;
      isAdjusted = true;
    }

    contributions.push({ center, spread, peak, gi: item.gi, isAdjusted });
  });

  // Generate data points: 0 to 240 min in 5-min intervals
  for (let t = 0; t <= 240; t += 5) {
    let totalImpact = 0;
    contributions.forEach(({ center, spread, peak }) => {
      totalImpact += gaussianImpact(t, center, spread, peak);
    });
    dataPoints.push({ time_minutes: t, impact: Math.max(0, totalImpact) });
  }

  return dataPoints;
}

/**
 * Analyze GL severity and return badge color
 */
export function getGLBadgeColor(mealGL: number): string {
  if (mealGL <= 10) return "#22c55e"; // green
  if (mealGL <= 19) return "#eab308"; // yellow
  return "#f97316"; // amber
}

/**
 * Analyze GL severity label (Spanish)
 */
export function getGLLabel(mealGL: number): string {
  if (mealGL <= 10) return "Baja";
  if (mealGL <= 19) return "Media";
  return "Alta";
}
