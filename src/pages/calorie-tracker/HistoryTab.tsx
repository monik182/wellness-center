import { useState, useEffect } from "react";
import { getTodayCET, sumMealTotals, type LoggedMeal, type MacroTotals } from "./types";
import { api } from "../../api/client";

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
      // Deduplicate by id
      const existingIds = new Set(allMeals.map((m) => m.id));
      const newMeals = more.filter((m) => !existingIds.has(m.id));
      setAllMeals([...allMeals, ...newMeals]);
      setHasMore(more.length >= PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }

  // Group meals by date
  const grouped = new Map<string, LoggedMeal[]>();
  for (const meal of allMeals) {
    const list = grouped.get(meal.date) ?? [];
    list.push(meal);
    grouped.set(meal.date, list);
  }

  // Sort days
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
      <div style={{
        display: "flex", justifyContent: "flex-end", marginBottom: 12,
      }}>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          style={{
            background: "none", border: "1px solid var(--border)", borderRadius: 6,
            padding: "4px 10px", fontSize: 11, color: "var(--muted)", cursor: "pointer",
          }}
        >
          {sortAsc ? "Mas antiguo primero" : "Mas reciente primero"}
        </button>
      </div>

      {loading ? (
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "24px 0" }}>
          Cargando...
        </p>
      ) : sortedDays.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "24px 0" }}>
          Sin registros anteriores.
        </p>
      ) : (
        sortedDays.map((date) => {
          const dayMeals = grouped.get(date)!.sort((a, b) => b.time.localeCompare(a.time));
          const dayTotal = sumMealTotals(dayMeals);

          return (
            <div key={date} style={{ marginBottom: 20 }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                marginBottom: 8,
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", textTransform: "capitalize" }}>
                  {formatDate(date)}
                </p>
                <p style={{ fontSize: 11, color: "var(--muted)" }}>
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
        <button
          onClick={loadMore}
          disabled={loadingMore}
          style={{
            width: "100%", padding: "11px 0", marginTop: 4,
            borderRadius: 10, border: "1.5px dashed var(--border)",
            background: "transparent", color: "var(--muted)",
            fontSize: 13, cursor: loadingMore ? "default" : "pointer",
          }}
        >
          {loadingMore ? "Cargando..." : "Cargar mas"}
        </button>
      )}
    </div>
  );
}

function DayTotalsGrid({ totals }: { totals: MacroTotals }) {
  return (
    <div style={{
      background: "var(--cream)", borderRadius: 10, border: "1px solid var(--border)",
      padding: 10, marginBottom: 8,
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6,
    }}>
      {[
        { label: "Kcal",     val: Math.round(totals.kcal) },
        { label: "Proteina", val: `${Math.round(totals.protein * 10) / 10}g` },
        { label: "Carbos",   val: `${Math.round(totals.carbs * 10) / 10}g` },
        { label: "Grasa",    val: `${Math.round(totals.fat * 10) / 10}g` },
        { label: "Fibra",    val: `${Math.round(totals.fiber * 10) / 10}g` },
        { label: "Azucar",   val: `${Math.round(totals.sugar * 10) / 10}g` },
      ].map(({ label, val }) => (
        <div key={label} style={{ textAlign: "center" }}>
          <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>{label}</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{val}</p>
        </div>
      ))}
    </div>
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
    <div style={{
      background: "var(--cream)", borderRadius: 10,
      border: "1px solid var(--border)", marginBottom: 8, overflow: "hidden",
    }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", textAlign: "left", padding: "10px 12px",
          background: "none", border: "none", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}
      >
        <div>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>{meal.time}</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
            {meal.items.map((i) => i.name).join(", ")}
          </p>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0, marginLeft: 8 }}>
          {Math.round(t.kcal)} kcal · {Math.round(t.protein)}g P
        </p>
      </button>

      {expanded && (
        <div style={{ padding: "0 12px 12px" }}>
          {meal.items.map((item, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              fontSize: 11, color: "var(--muted)", padding: "4px 0",
              borderTop: "1px solid var(--border)",
            }}>
              <span>{item.name} ({item.weight_g}g)</span>
              <span>{Math.round(item.kcal)} kcal · {Math.round(item.protein * 10) / 10}g P · {Math.round(item.carbs * 10) / 10}g C</span>
            </div>
          ))}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6, marginTop: 10, fontSize: 11,
          }}>
            {[
              { label: "Kcal",     val: Math.round(t.kcal) },
              { label: "Proteina", val: `${Math.round(t.protein * 10) / 10}g` },
              { label: "Carbos",   val: `${Math.round(t.carbs * 10) / 10}g` },
              { label: "Grasa",    val: `${Math.round(t.fat * 10) / 10}g` },
              { label: "Fibra",    val: `${Math.round(t.fiber * 10) / 10}g` },
              { label: "Azucar",   val: `${Math.round(t.sugar * 10) / 10}g` },
            ].map(({ label, val }) => (
              <div key={label} style={{ background: "var(--beige)", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                <p style={{ color: "var(--muted)", marginBottom: 2 }}>{label}</p>
                <p style={{ fontWeight: 600, color: "var(--ink)" }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
