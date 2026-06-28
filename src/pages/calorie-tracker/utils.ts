import type { LoggedFoodItem } from "./types";
import type { ResolveResponse } from "../../api/client";

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function itemFromResolve(resolved: ResolveResponse, weight_g: number): LoggedFoodItem {
  const scale = weight_g / 100;
  return {
    foodId: `resolved-${resolved.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: resolved.name,
    weight_g,
    source: resolved.source,
    kcal: resolved.per_100g.kcal * scale,
    protein: resolved.per_100g.protein * scale,
    carbs: resolved.per_100g.carbs * scale,
    fat: resolved.per_100g.fat * scale,
    fiber: resolved.per_100g.fiber * scale,
    sugar: resolved.per_100g.sugar * scale,
  };
}

export function getToday(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function getCurrentTime(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function formatTime(time24: string): string {
  const [h, m] = time24.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${suffix}`;
}
