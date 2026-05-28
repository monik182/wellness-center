import { useState, useEffect, useMemo } from "react";
import { getTodayCET, sumMealTotals, type LoggedMeal } from "./types";
import { api } from "../../api/client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type DateFilter = "hoy" | "ayer" | "esta_semana" | "este_mes" | "ultimo_mes" | "";

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return dt.toISOString().slice(0, 10);
}

function getFilterRange(filter: DateFilter, today: string): { from: string; to: string } | null {
  if (!filter) return null;
  const [y, m] = today.split("-").map(Number);
  switch (filter) {
    case "hoy":
      return { from: today, to: today };
    case "ayer": {
      const yesterday = addDays(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case "esta_semana":
      return { from: addDays(today, -6), to: today };
    case "este_mes": {
      const firstDay = `${y}-${String(m).padStart(2, "0")}-01`;
      return { from: firstDay, to: today };
    }
    case "ultimo_mes": {
      const prevMonth = m === 1 ? 12 : m - 1;
      const prevYear = m === 1 ? y - 1 : y;
      const firstDay = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m - 1, 0).toISOString().slice(0, 10);
      return { from: firstDay, to: lastDay };
    }
    default:
      return null;
  }
}

const DEFAULT_DAYS_BACK = 3;
const LOAD_MORE_LIMIT = 30;

export default function HistoryTab() {
  const [allMeals, setAllMeals] = useState<LoggedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>("");

  const today = getTodayCET();

  // Initial load
  useEffect(() => {
    const startDate = addDays(today, 1);
    api.getMealHistory(startDate, LOAD_MORE_LIMIT)
      .then((meals) => {
        setAllMeals(meals);
        setHasMore(meals.length >= LOAD_MORE_LIMIT);
      })
      .finally(() => setLoading(false));
  }, [today]);

  function handleFilterChange(filter: DateFilter) {
    setDateFilter(filter);
    setLoading(true);
    if (filter) {
      const range = getFilterRange(filter, today);
      if (!range) return;
      api.getMealHistory(addDays(range.to, 1), 200)
        .then((meals) => {
          const filtered = meals.filter((m) => m.date >= range.from && m.date <= range.to);
          setAllMeals(filtered);
          setHasMore(false);
        })
        .finally(() => setLoading(false));
    } else {
      const startDate = addDays(today, 1);
      api.getMealHistory(startDate, LOAD_MORE_LIMIT)
        .then((meals) => {
          setAllMeals(meals);
          setHasMore(meals.length >= LOAD_MORE_LIMIT);
        })
        .finally(() => setLoading(false));
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    const dates = allMeals.map((m) => m.date);
    const oldestDate = dates.length > 0 ? dates[dates.length - 1] : today;
    setLoadingMore(true);
    try {
      const more = await api.getMealHistory(oldestDate, LOAD_MORE_LIMIT);
      const existingIds = new Set(allMeals.map((m) => m.id));
      const newMeals = more.filter((m) => !existingIds.has(m.id));
      setAllMeals([...allMeals, ...newMeals]);
      setHasMore(more.length >= LOAD_MORE_LIMIT);
    } finally {
      setLoadingMore(false);
    }
  }

  // Filter for default view (3 days back)
  const displayMeals = useMemo(() => {
    if (dateFilter) return allMeals;
    const cutoff = addDays(today, -DEFAULT_DAYS_BACK);
    return allMeals.filter((m) => m.date >= cutoff);
  }, [allMeals, dateFilter, today]);

  const grouped = new Map<string, LoggedMeal[]>();
  for (const meal of displayMeals) {
    const list = grouped.get(meal.date) ?? [];
    list.push(meal);
    grouped.set(meal.date, list);
  }

  const sortedDays = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  function formatDate(dateStr: string): string {
    const yesterday = addDays(today, -1);
    const [y, mo, d] = dateStr.split("-").map(Number);
    const formatted = new Date(y, mo - 1, d).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (dateStr === today) return `Hoy (${formatted})`;
    if (dateStr === yesterday) return `Ayer (${formatted})`;
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  return (
    <div>
      {/* Date filter */}
      <div className="flex items-center gap-2 mb-5">
        <select
          value={dateFilter}
          onChange={(e) => handleFilterChange(e.target.value as DateFilter)}
          className="flex-1 px-2.5 py-1.5 text-[12px] font-[inherit] rounded-[4px]"
          style={{
            background: "var(--cream)",
            border: "1px solid var(--border-color)",
            color: "var(--ink)",
          }}
        >
          <option value="">Ultimos 3 dias</option>
          <option value="hoy">Hoy</option>
          <option value="ayer">Ayer</option>
          <option value="esta_semana">Esta semana</option>
          <option value="este_mes">Este mes</option>
          <option value="ultimo_mes">Ultimo mes</option>
        </select>
        {dateFilter && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => handleFilterChange("")}
          >
            <X size={14} />
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-center py-6" style={{ color: "var(--ink-muted)" }}>Cargando...</p>
      ) : sortedDays.length === 0 ? (
        <p className="text-xs text-center py-6" style={{ color: "var(--ink-muted)" }}>Sin registros.</p>
      ) : (
        sortedDays.map((date) => {
          const dayMeals = grouped.get(date)!.sort((a, b) => a.time.localeCompare(b.time));
          const dayTotal = sumMealTotals(dayMeals);

          return (
            <div key={date} className="mb-6">
              {/* Date header */}
              <div className="flex justify-between items-baseline mb-2">
                <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                  {formatDate(date)}
                </p>
                <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                  {Math.round(dayTotal.kcal)} kcal · {Math.round(dayTotal.protein)}g P
                </p>
              </div>

              {/* Meal rows */}
              {dayMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center py-3 px-4 mb-1.5 rounded-[4px]"
                  style={{ background: "var(--cream)" }}
                >
                  <span
                    className="text-[11px] w-12 shrink-0"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {meal.time}
                  </span>
                  <span
                    className="flex-1 text-[13px] font-medium truncate"
                    style={{ color: "var(--ink)" }}
                  >
                    {meal.items.map((i) => i.name).join(", ")}
                  </span>
                  <span
                    className="text-[12px] shrink-0 ml-3"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {Math.round(meal.totals.kcal)} kcal
                  </span>
                </div>
              ))}
            </div>
          );
        })
      )}

      {/* Load more */}
      {hasMore && !loading && !dateFilter && (
        <Button
          variant="outline"
          className="w-full mt-1 border-dashed"
          disabled={loadingMore}
          onClick={loadMore}
        >
          {loadingMore ? "Cargando..." : "Cargar mas"}
        </Button>
      )}
    </div>
  );
}
