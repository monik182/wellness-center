import type { FoodGroup } from "../../data/foods";

export interface TrackerFood {
  id: string;
  name: string;
  group: FoodGroup;
  defaultWeight_g: number;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sugarPer100g: number;
}

export interface LoggedFoodItem {
  foodId: string;
  name: string;
  weight_g: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface MacroTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface LoggedMeal {
  id: string;
  date: string; // YYYY-MM-DD CET
  time: string; // HH:MM CET
  items: LoggedFoodItem[];
  totals: MacroTotals;
}

export const TARGETS = {
  regular: { kcal: 1475, protein: 120, carbs: 165, fat: 45, fiber: 27, sugar: 25 },
  gym:     { kcal: 1650, protein: 130, carbs: 195, fat: 50, fiber: 27, sugar: 25 },
} as const;

// CET/CEST-aware helpers using Europe/Madrid timezone
export function getTodayCET(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function getCurrentTimeCET(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export function macroScale(
  food: TrackerFood,
  weight_g: number
): Omit<LoggedFoodItem, "foodId" | "name" | "weight_g"> {
  const r = (n: number) => Math.round(n * 10) / 10;
  const s = weight_g / 100;
  return {
    kcal:    r(food.kcalPer100g    * s),
    protein: r(food.proteinPer100g * s),
    carbs:   r(food.carbsPer100g   * s),
    fat:     r(food.fatPer100g     * s),
    fiber:   r(food.fiberPer100g   * s),
    sugar:   r(food.sugarPer100g   * s),
  };
}

export function sumTotals(items: LoggedFoodItem[]): MacroTotals {
  return items.reduce(
    (acc, item) => ({
      kcal:    acc.kcal    + item.kcal,
      protein: acc.protein + item.protein,
      carbs:   acc.carbs   + item.carbs,
      fat:     acc.fat     + item.fat,
      fiber:   acc.fiber   + item.fiber,
      sugar:   acc.sugar   + item.sugar,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
  );
}

export function sumMealTotals(meals: LoggedMeal[]): MacroTotals {
  return sumTotals(meals.flatMap((m) => m.items));
}

export interface Suggestion {
  foodId: string;
  name: string;
  weight_g: number;
  reason: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
