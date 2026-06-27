import { useState, useEffect, useCallback } from "react";
import { api } from "../../../api/client";
import type { LoggedMeal } from "../types";

export function useMeals(date: string) {
  const [meals, setMeals] = useState<LoggedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMeals(date);
      setMeals(data.sort((a, b) => a.time.localeCompare(b.time)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load meals");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetch(); }, [fetch]);

  return { meals, loading, error, refetch: fetch };
}
