import type { LoggedMeal } from "../pages/calorie-tracker/types";

const BASE = import.meta.env.VITE_API_URL ?? "";
const KEY  = import.meta.env.VITE_API_KEY  ?? "";

function headers(): Record<string, string> {
  return { "Content-Type": "application/json", "X-Api-Key": KEY };
}

export const api = {
  getMeals: (date: string): Promise<LoggedMeal[]> =>
    fetch(`${BASE}/api/meals?date=${date}`, { headers: headers() }).then((r) => r.json()),

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
};
