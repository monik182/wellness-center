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
};
