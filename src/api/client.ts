import type { LoggedMeal, Suggestion, TrackerFood, MacroTotals, ChatMessage } from "../pages/calorie-tracker/types";

export interface DetectedItem {
  name: string;
  weight_g: number;
  confidence: number;
  reasoning: string;
}

export interface DetectImageResult {
  success: boolean;
  detected_items?: DetectedItem[];
  confidence_summary?: string;
  warnings?: string[];
  error?: string;
}

export interface ResolveResponse {
  name: string;
  weight_g: number;
  source: "hardcoded" | "off" | "off_barcode" | "haiku" | "label_scan" | "custom";
  per_100g: { kcal: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number };
  macros:   { kcal: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number };
  default_weight_g?: number;
  portion?: string;
}

export interface NutritionLabelData {
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

export interface NutritionLabelResult {
  success: boolean;
  error?: string;
  missing_fields?: string[];
  extracted?: Partial<NutritionLabelData>;
  product_name?: string;
  serving_size?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  sugar_g?: number;
  fat_g?: number;
  saturated_fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  confidence?: number;
  notes?: string;
  warnings?: string[];
}

export type AnalyzeImageResult =
  | { type: "food"; success: boolean; detected_items?: DetectedItem[]; confidence_summary?: string; warnings?: string[] }
  | { type: "label"; success: boolean; extracted?: Partial<NutritionLabelData>; warnings?: string[] }
  | { type: "barcode"; found: boolean; code: string | null; product?: { name: string; kcal: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; per_100g: boolean; default_weight_g: number }; message?: string; error?: string };

export interface CustomFood {
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

export interface CustomFoodInput {
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

const BASE = import.meta.env.VITE_API_URL ?? "";
const KEY  = import.meta.env.VITE_API_KEY  ?? "";

function headers(): Record<string, string> {
  return { "Content-Type": "application/json", "X-Api-Key": KEY };
}

export const api = {
  getMeals: (date: string): Promise<LoggedMeal[]> =>
    fetch(`${BASE}/api/meals?date=${date}`, { headers: headers() }).then((r) => r.json()),

  getMealHistory: (before: string, limit = 14): Promise<LoggedMeal[]> =>
    fetch(`${BASE}/api/meals/history?before=${before}&limit=${limit}`, { headers: headers() }).then((r) => r.json()),

  addMeal: (meal: LoggedMeal): Promise<void> =>
    fetch(`${BASE}/api/meals`, { method: "POST", headers: headers(), body: JSON.stringify(meal) }).then(() => {}),

  updateMeal: (id: string, patch: Pick<LoggedMeal, "items" | "totals" | "time">): Promise<void> =>
    fetch(`${BASE}/api/meals/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(patch) }).then(() => {}),

  deleteMeal: (id: string): Promise<void> =>
    fetch(`${BASE}/api/meals/${id}`, { method: "DELETE", headers: headers() }).then(() => {}),

  getGymDay: (): Promise<{ active: boolean; date: string }> =>
    fetch(`${BASE}/api/gym-day`, { headers: headers() }).then((r) => r.json()),

  setGymDay: (active: boolean, date: string): Promise<void> =>
    fetch(`${BASE}/api/gym-day`, { method: "PUT", headers: headers(), body: JSON.stringify({ active, date }) }).then(() => {}),

  getSuggestions: (payload: {
    remaining: MacroTotals;
    time: string;
    is_gym_day: boolean;
    meals_today: string[];
    foods: TrackerFood[];
  }): Promise<Suggestion[]> =>
    fetch(`${BASE}/api/suggest`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    }).then((r) => r.json()),

  transcribe: (blob: Blob): Promise<{ text: string }> =>
    fetch(`${BASE}/api/transcribe`, {
      method: "POST",
      headers: { "X-Api-Key": KEY, "Content-Type": blob.type },
      body: blob,
    }).then((r) => r.json()),

  chat: (
    messages: ChatMessage[],
    foods: Array<{ id: string; name: string; defaultWeight_g: number }>
  ): Promise<
    | { type: "items"; items: Array<{ foodId: string; name: string; weight_g: number }> }
    | { type: "message"; text: string }
  > =>
    fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ messages, foods }),
    }).then((r) => r.json()),

  detectImage: (
    image: string,
    mimeType: string,
    foods: Array<{ id: string; name: string; group: string }>
  ): Promise<DetectImageResult> =>
    fetch(`${BASE}/api/detect-image`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ image, mimeType, foods }),
    }).then((r) => r.json()),

  resolveNutrition: (name: string, weight_g: number): Promise<ResolveResponse> =>
    fetch(`${BASE}/api/nutrition/resolve`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ name, weight_g }),
    }).then((r) => r.json()),

  extractNutritionLabel: (image: string, mimeType: string): Promise<NutritionLabelResult> =>
    fetch(`${BASE}/api/nutrition-labels/extract`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ image, mimeType }),
    }).then((r) => r.json()),

  getCustomFoods: (): Promise<{ success: boolean; foods: CustomFood[] }> =>
    fetch(`${BASE}/api/custom-foods`, { headers: headers() }).then((r) => r.json()),

  saveCustomFood: (food: CustomFoodInput): Promise<{ success: boolean; food?: CustomFood; error?: string }> =>
    fetch(`${BASE}/api/custom-foods`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(food),
    }).then((r) => r.json()),

  analyzeImage: (
    image: string,
    mimeType: string,
    foods?: Array<{ id: string; name: string; group: string }>
  ): Promise<AnalyzeImageResult> =>
    fetch(`${BASE}/api/analyze-image`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ image, mimeType, foods }),
    }).then((r) => r.json()),

  resolveBarcode: (
    code: string
  ): Promise<{
    found: boolean;
    code: string;
    product?: { name: string; kcal: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; per_100g: boolean; default_weight_g: number };
    message?: string;
    error?: string;
  }> =>
    fetch(`${BASE}/api/barcode/lookup`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ code }),
    }).then((r) => r.json()),
};
