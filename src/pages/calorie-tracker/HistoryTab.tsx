import { useState, useEffect } from "react";
import { getTodayCET, sumMealTotals, type LoggedMeal, type MacroTotals } from "./types";
import { api } from "../../api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 14;

export default function HistoryTab() {
  const [allMeals, setAllMeals] = useState<LoggedMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(false);

  const today = getTodayCET();

  useEffect(() => {
    api.getMealHistory(today, PAGE_SIZE)
      .then((meals) => {
        setAllMeals(meals);
        setHasMore(meals.length >= PAGE_SIZE);
      })
      .finally(() => setLoading(false));
  }, [today]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    const dates = allMeals.map((m) => m.date);
    const oldestDate = dates.length > 0 ? dates[dates.length - 1] : today;
    setLoadingMore(true);
    try {
      const more = await api.getMealHistory(oldestDate, PAGE_SIZE);
      const existingIds = new Set(allMeals.map((m) => m.id));
      const newMeals = more.filter((m) => !existingIds.has(m.id));
      setAllMeals([...allMeals, ...newMeals]);
      setHasMore(more.length >= PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }

  const grouped = new Map<string, LoggedMeal[]>();
  for (const meal of allMeals) {
    const list = grouped.get(meal.date) ?? [];
    list.push(meal);
    grouped.set(meal.date, list);
  }

  const sortedDays = Array.from(grouped.keys()).sort((a, b) =>
    sortAsc ? a.localeCompare(b) : b.localeCompare(a)
  );

  function formatDate(dateStr: string): string {
    const [y, mo, d] = dateStr.split("-").map(Number);
    return new Date(y, mo - 1, d).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  return (
    <div>
      {/* Sort toggle */}
      <div className="flex justify-end mb-3">
        <Button
          variant="outline"
          size="sm"
          className="text-[11px] h-auto py-1 px-2.5"
          onClick={() => setSortAsc(!sortAsc)}
        >
          {sortAsc ? "Mas antiguo primero" : "Mas reciente primero"}
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-center py-6" style={{ color: "var(--ink-muted)" }}>Cargando...</p>
      ) : sortedDays.length === 0 ? (
        <p className="text-xs text-center py-6" style={{ color: "var(--ink-muted)" }}>Sin registros anteriores.</p>
      ) : (
        sortedDays.map((date) => {
          const dayMeals = grouped.get(date)!.sort((a, b) => b.time.localeCompare(a.time));
          const dayTotal = sumMealTotals(dayMeals);

          return (
            <div key={date} className="mb-5">
              <div className="flex justify-between items-baseline mb-2">
                <p className="text-[13px] font-semibold capitalize" style={{ color: "var(--ink)" }}>
                  {formatDate(date)}
                </p>
                <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                  {Math.round(dayTotal.kcal)} kcal · {Math.round(dayTotal.protein)}g P
                </p>
              </div>

              <DayTotalsGrid totals={dayTotal} />

              {dayMeals.map((meal) => (
                <HistoryMealCard
                  key={meal.id}
                  meal={meal}
                  expanded={expandedId === meal.id}
                  onToggle={() => setExpandedId(expandedId === meal.id ? null : meal.id)}
                />
              ))}
            </div>
          );
        })
      )}

      {hasMore && !loading && (
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

function DayTotalsGrid({ totals }: { totals: MacroTotals }) {
  return (
    <Card className="mb-2">
      <CardContent className="py-2.5 grid grid-cols-3 gap-1.5">
        {[
          { label: "Kcal",     val: Math.round(totals.kcal) },
          { label: "Proteina", val: `${Math.round(totals.protein * 10) / 10}g` },
          { label: "Carbos",   val: `${Math.round(totals.carbs * 10) / 10}g` },
          { label: "Grasa",    val: `${Math.round(totals.fat * 10) / 10}g` },
          { label: "Fibra",    val: `${Math.round(totals.fiber * 10) / 10}g` },
          { label: "Azucar",   val: `${Math.round(totals.sugar * 10) / 10}g` },
        ].map(({ label, val }) => (
          <div key={label} className="text-center">
            <p className="text-[10px] mb-0.5" style={{ color: "var(--ink-muted)" }}>{label}</p>
            <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{val}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function HistoryMealCard({
  meal, expanded, onToggle,
}: {
  meal: LoggedMeal;
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = meal.totals;
  return (
    <Card className="mb-2 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-3 py-2.5 bg-transparent border-0 cursor-pointer flex justify-between items-start"
      >
        <div>
          <p className="text-xs mb-0.5" style={{ color: "var(--ink-muted)" }}>{meal.time}</p>
          <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
            {meal.items.map((i) => i.name).join(", ")}
          </p>
        </div>
        <p className="text-xs shrink-0 ml-2" style={{ color: "var(--ink-muted)" }}>
          {Math.round(t.kcal)} kcal · {Math.round(t.protein)}g P
        </p>
      </button>

      {expanded && (
        <CardContent className="pt-0 pb-3 px-3">
          {meal.items.map((item, i) => (
            <div
              key={i}
              className="flex justify-between text-[11px] py-1"
              style={{ borderTop: "1px solid var(--border-color)", color: "var(--ink-muted)" }}
            >
              <span>{item.name} ({item.weight_g}g)</span>
              <span>{Math.round(item.kcal)} kcal · {Math.round(item.protein * 10) / 10}g P · {Math.round(item.carbs * 10) / 10}g C</span>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-[11px]">
            {[
              { label: "Kcal",     val: Math.round(t.kcal) },
              { label: "Proteina", val: `${Math.round(t.protein * 10) / 10}g` },
              { label: "Carbos",   val: `${Math.round(t.carbs * 10) / 10}g` },
              { label: "Grasa",    val: `${Math.round(t.fat * 10) / 10}g` },
              { label: "Fibra",    val: `${Math.round(t.fiber * 10) / 10}g` },
              { label: "Azucar",   val: `${Math.round(t.sugar * 10) / 10}g` },
            ].map(({ label, val }) => (
              <div key={label} className="px-2 py-1.5 text-center" style={{ background: "var(--beige)" }}>
                <p className="mb-0.5" style={{ color: "var(--ink-muted)" }}>{label}</p>
                <p className="font-semibold" style={{ color: "var(--ink)" }}>{val}</p>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
