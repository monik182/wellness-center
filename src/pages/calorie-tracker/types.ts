import type { FoodGroup, FoodTag } from "../../data/foods";

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
  tags: FoodTag[];
}

export type FoodUnit = "g" | "ml" | "units";

export interface LoggedFoodItem {
  foodId: string;
  name: string;
  weight_g: number;
  unit?: FoodUnit; // g | ml | units. Absent = 'g'. For backward compat with old D1 data.
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  source?: "hardcoded" | "off" | "off_barcode" | "haiku" | "label_scan" | "custom";
  gi?: number; // Glycemic Index value (0-100)
  gi_source?: "hardcoded" | "haiku"; // Where GI came from
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
  consumption_order?: number[]; // Indices into items array, in consumption order
}

export type ActivityLevel = "rest" | "low" | "medium" | "high";

export const ACTIVITY_LEVELS = [
  { level: "rest" as const,   label: "Descanso", desc: "Sin ejercicio. Día de recuperación." },
  { level: "low" as const,    label: "Baja",     desc: "Caminata ligera, yoga suave, estiramientos activos, paseo largo." },
  { level: "medium" as const, label: "Media",    desc: "Yoga dinámico, caminata larga/rápida, bicicleta recreativa, natación suave." },
  { level: "high" as const,   label: "Alta",     desc: "Gimnasio (pesas), HIIT, running, natación intensa, deportes competitivos." },
] as const;

export const TARGETS: Record<ActivityLevel, { kcal: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number }> = {
  rest:   { kcal: 1475, protein: 120, carbs: 148, fat: 49, fiber: 27, sugar: 25 },
  low:    { kcal: 1520, protein: 122, carbs: 152, fat: 51, fiber: 27, sugar: 25 },
  medium: { kcal: 1565, protein: 125, carbs: 157, fat: 52, fiber: 27, sugar: 25 },
  high:   { kcal: 1650, protein: 130, carbs: 165, fat: 55, fiber: 27, sugar: 25 },
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

// Journal view exercise levels (Phase 1 refactor)
export type ExerciseLevel = "none" | "easy" | "medium" | "hard";

export const EXERCISE_LEVELS = [
  { level: "none" as const,   label: "None",   desc: "Rest day. No exercise." },
  { level: "easy" as const,   label: "Easy",   desc: "Light walk, gentle yoga, stretching." },
  { level: "medium" as const, label: "Medium", desc: "Dynamic yoga, long walk, recreational cycling." },
  { level: "hard" as const,   label: "Hard",   desc: "Gym (weights), HIIT, running, intense swimming." },
] as const;

export const JOURNAL_TARGETS: Record<ExerciseLevel, MacroTotals> = {
  none:   { kcal: 1475, protein: 120, carbs: 148, fat: 49, fiber: 27, sugar: 25 },
  easy:   { kcal: 1550, protein: 125, carbs: 155, fat: 52, fiber: 27, sugar: 25 },
  medium: { kcal: 1650, protein: 130, carbs: 165, fat: 55, fiber: 27, sugar: 25 },
  hard:   { kcal: 1750, protein: 135, carbs: 175, fat: 58, fiber: 27, sugar: 25 },
};

// Phase 2: pending entry state for text logging
export type PendingStatus = "resolving" | "saving" | "error";

export interface PendingEntry {
  id: string;
  text: string;
  time: string;
  status: PendingStatus;
  error?: string;
  resolved?: LoggedFoodItem;
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
  image?: string; // base64 dataURL for local display only
}

export interface GlucoseDataPoint {
  time_minutes: number;
  impact: number;
}
