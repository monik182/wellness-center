import { useState } from "react";
import { loadMeals, getTodayCET, type LoggedMeal, type MacroTotals } from "./types";

export default function HistoryTab() {
  const [allMeals] = useState<LoggedMeal[]>(loadMeals);
  const [selectedDate, setSelectedDate] = useState(getTodayCET);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const mealsForDate = [...allMeals.filter((m) => m.date === selectedDate)].sort(
    (a, b) => b.time.localeCompare(a.time)
  );

  const dayTotal: MacroTotals = mealsForDate.reduce(
    (acc, meal) => ({
      kcal:    acc.kcal    + meal.totals.kcal,
      protein: acc.protein + meal.totals.protein,
      carbs:   acc.carbs   + meal.totals.carbs,
      fat:     acc.fat     + meal.totals.fat,
      fiber:   acc.fiber   + meal.totals.fiber,
      sugar:   acc.sugar   + meal.totals.sugar,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
  );

  const [y, mo, d] = selectedDate.split("-").map(Number);
  const dateDisplay = new Date(y, mo - 1, d).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Date picker */}
      <input
        type="date"
        value={selectedDate}
        max={getTodayCET()}
        onChange={(e) => {
          setSelectedDate(e.target.value);
          setExpandedId(null);
        }}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 10,
          border: "1px solid var(--border)", background: "var(--cream)",
          fontSize: 13, fontFamily: "inherit", marginBottom: 14,
          outline: "none",
        }}
      />

      <p style={{ fontSize: 12, color: "var(--muted)", textTransform: "capitalize", marginBottom: 12 }}>
        {dateDisplay}
      </p>

      {mealsForDate.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "24px 0" }}>
          Sin registros para esta fecha.
        </p>
      ) : (
        <>
          {/* Day total */}
          <div style={{
            background: "var(--cream)", borderRadius: 10, border: "1px solid var(--border)",
            padding: 12, marginBottom: 12,
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
          }}>
            {[
              { label: "Kcal",     val: Math.round(dayTotal.kcal) },
              { label: "Proteina", val: `${Math.round(dayTotal.protein * 10) / 10}g` },
              { label: "Carbos",   val: `${Math.round(dayTotal.carbs * 10) / 10}g` },
              { label: "Grasa",    val: `${Math.round(dayTotal.fat * 10) / 10}g` },
              { label: "Fibra",    val: `${Math.round(dayTotal.fiber * 10) / 10}g` },
              { label: "Azucar",   val: `${Math.round(dayTotal.sugar * 10) / 10}g` },
            ].map(({ label, val }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Meal list */}
          {mealsForDate.map((meal) => (
            <HistoryMealCard
              key={meal.id}
              meal={meal}
              expanded={expandedId === meal.id}
              onToggle={() => setExpandedId(expandedId === meal.id ? null : meal.id)}
            />
          ))}
        </>
      )}
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
