import { useState, useEffect, useCallback } from "react";
import { api } from "../../../api/client";
import type { LoggedMeal } from "../types";

const cache = new Map<string, LoggedMeal[]>();

function sortMeals(data: LoggedMeal[]): LoggedMeal[] {
  return [...data].sort((a, b) => a.time.localeCompare(b.time));
}

export async function prefetchMeals(date: string) {
  if (cache.has(date)) return;
  try {
    const data = await api.getMeals(date);
    cache.set(date, sortMeals(data));
  } catch {
    // best-effort prefetch; ignore failures
  }
}

export function useMeals(date: string) {
  const [meals, setMeals] = useState<LoggedMeal[]>(() => cache.get(date) ?? []);
  const [loading, setLoading] = useState(() => !cache.has(date));
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const cached = cache.get(date);
    if (cached) {
      setMeals(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const sorted = sortMeals(await api.getMeals(date));
      cache.set(date, sorted);
      setMeals(sorted);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load meals");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetch(); }, [fetch]);

  return { meals, loading, error, refetch: fetch };
}
