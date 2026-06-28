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

// Parse a YYYY-MM-DD string to a local Date at noon (avoids DST/tz edge shifts).
function parseDateLocal(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

// Days from Monday (0) to Sunday (6) for a given Date.
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

// Add (or subtract) n days to a YYYY-MM-DD string, returning YYYY-MM-DD.
export function addDays(date: string, n: number): string {
  const d = parseDateLocal(date);
  d.setDate(d.getDate() + n);
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatHeaderDate(date: string, today: string): string {
  if (date === today) return "Today";

  const d = parseDateLocal(date);
  const t = parseDateLocal(today);
  const dayMs = 86_400_000;
  const diffDays = Math.round((t.getTime() - d.getTime()) / dayMs);

  if (diffDays === 1) return "Yesterday";

  // Same Monday-anchored week as today (and a past day within it) -> weekday name.
  const weekStart = new Date(t);
  weekStart.setDate(t.getDate() - mondayIndex(t));
  if (d >= weekStart && d < t) {
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(d);
  }

  const sameYear = d.getFullYear() === t.getFullYear();
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(d);
}

export function formatTime(time24: string): string {
  const [h, m] = time24.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${suffix}`;
}
