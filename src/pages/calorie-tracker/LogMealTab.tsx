import { useState, useMemo } from "react";
import { TRACKER_FOODS } from "../../data/calorieTrackerFoods";
import {
  loadMeals, saveMeals, getTodayCET, getCurrentTimeCET,
  macroScale, sumTotals,
  type TrackerFood, type LoggedFoodItem, type LoggedMeal,
} from "./types";

export interface SelectorItem {
  foodId: string;
  weight_g: number;
}

interface Props {
  selectorItems: SelectorItem[];
  setSelectorItems: (items: SelectorItem[]) => void;
  onLogged: () => void;
}

export default function LogMealTab({ selectorItems, setSelectorItems, onLogged }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return TRACKER_FOODS;
    const q = query.toLowerCase();
    return TRACKER_FOODS.filter((f) => f.name.toLowerCase().includes(q));
  }, [query]);

  function addFood(food: TrackerFood) {
    // If already in list, increment weight by defaultWeight_g
    const existing = selectorItems.findIndex((i) => i.foodId === food.id);
    if (existing >= 0) {
      const updated = selectorItems.map((item, idx) =>
        idx === existing
          ? { ...item, weight_g: item.weight_g + food.defaultWeight_g }
          : item
      );
      setSelectorItems(updated);
    } else {
      setSelectorItems([{ foodId: food.id, weight_g: food.defaultWeight_g }, ...selectorItems]);
    }
  }

  function updateWeight(idx: number, raw: string) {
    const w = parseFloat(raw);
    if (isNaN(w) || w <= 0) return;
    setSelectorItems(selectorItems.map((item, i) => i === idx ? { ...item, weight_g: w } : item));
  }

  function removeItem(idx: number) {
    setSelectorItems(selectorItems.filter((_, i) => i !== idx));
  }

  function buildLoggedItems(): LoggedFoodItem[] {
    return selectorItems.map((sel) => {
      const food = TRACKER_FOODS.find((f) => f.id === sel.foodId)!;
      return {
        foodId: sel.foodId,
        name: food.name,
        weight_g: sel.weight_g,
        ...macroScale(food, sel.weight_g),
      };
    });
  }

  function handleLog() {
    if (selectorItems.length === 0) return;
    const items = buildLoggedItems();
    const totals = sumTotals(items);
    const meal: LoggedMeal = {
      id: crypto.randomUUID(),
      date: getTodayCET(),
      time: getCurrentTimeCET(),
      items,
      totals,
    };
    const existing = loadMeals();
    saveMeals([...existing, meal]);
    setSelectorItems([]);
    onLogged();
  }

  // Running totals for selected items
  const runningTotals = useMemo(() => {
    const items = buildLoggedItems();
    return sumTotals(items);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectorItems]);

  const foodById = useMemo(() => {
    const map = new Map<string, TrackerFood>();
    TRACKER_FOODS.forEach((f) => map.set(f.id, f));
    return map;
  }, []);

  return (
    <div>
      {/* Search */}
      <input
        type="search"
        placeholder="Buscar alimento..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 10,
          border: "1px solid var(--border)", background: "var(--cream)",
          fontSize: 13, fontFamily: "inherit", marginBottom: 10,
          outline: "none",
        }}
      />

      {/* Food list */}
      {query.trim() && (
        <div style={{
          background: "var(--cream)", borderRadius: 10, border: "1px solid var(--border)",
          marginBottom: 14, maxHeight: 220, overflowY: "auto",
        }}>
          {filtered.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--muted)", padding: "12px 14px" }}>
              Sin resultados.
            </p>
          ) : (
            filtered.map((food) => (
              <button
                key={food.id}
                onClick={() => { addFood(food); setQuery(""); }}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  width: "100%", padding: "10px 14px", background: "none",
                  border: "none", borderBottom: "1px solid var(--border)",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{food.name}</p>
                  <p style={{ fontSize: 11, color: "var(--muted)" }}>
                    por 100g: {food.kcalPer100g} kcal · {food.proteinPer100g}g P
                  </p>
                </div>
                <span style={{
                  fontSize: 10, background: "var(--beige)", padding: "2px 8px",
                  borderRadius: 20, color: "var(--muted)", flexShrink: 0, marginLeft: 8,
                }}>
                  {food.group}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Selected items */}
      {selectorItems.length > 0 && (
        <>
          <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>
            SELECCIONADOS
          </p>
          {selectorItems.map((sel, idx) => {
            const food = foodById.get(sel.foodId);
            if (!food) return null;
            const macros = macroScale(food, sel.weight_g);
            return (
              <div
                key={`${sel.foodId}-${idx}`}
                style={{
                  background: "var(--cream)", borderRadius: 10, border: "1px solid var(--border)",
                  padding: "10px 12px", marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 3 }}>
                    {food.name}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--muted)" }}>
                    {Math.round(macros.kcal)} kcal · {Math.round(macros.protein * 10) / 10}g P · {Math.round(macros.carbs * 10) / 10}g C
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={sel.weight_g}
                    onChange={(e) => updateWeight(idx, e.target.value)}
                    style={{
                      width: 64, padding: "5px 6px", borderRadius: 6,
                      border: "1px solid var(--border)", background: "var(--beige)",
                      fontSize: 13, fontFamily: "inherit", textAlign: "center",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>g</span>
                </div>
                <button
                  onClick={() => removeItem(idx)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 16, color: "var(--muted)", padding: "0 4px",
                  }}
                >
                  x
                </button>
              </div>
            );
          })}

          {/* Running totals */}
          <div style={{
            background: "var(--beige)", borderRadius: 10, padding: 12,
            marginBottom: 14, fontSize: 12,
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6,
          }}>
            {[
              { label: "Kcal",     val: Math.round(runningTotals.kcal) },
              { label: "Proteina", val: `${Math.round(runningTotals.protein * 10) / 10}g` },
              { label: "Carbos",   val: `${Math.round(runningTotals.carbs * 10) / 10}g` },
              { label: "Grasa",    val: `${Math.round(runningTotals.fat * 10) / 10}g` },
              { label: "Fibra",    val: `${Math.round(runningTotals.fiber * 10) / 10}g` },
              { label: "Azucar",   val: `${Math.round(runningTotals.sugar * 10) / 10}g` },
            ].map(({ label, val }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 10, color: "var(--muted)" }}>{label}</p>
                <p style={{ fontWeight: 600, color: "var(--ink)" }}>{val}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setSelectorItems([])}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--beige)",
                fontSize: 13, cursor: "pointer", color: "var(--muted)",
              }}
            >
              Limpiar
            </button>
            <button
              onClick={handleLog}
              style={{
                flex: 2, padding: "10px 0", borderRadius: 10,
                border: "none", background: "var(--ink)", color: "var(--cream)",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Agregar al registro
            </button>
          </div>
        </>
      )}

      {selectorItems.length === 0 && !query.trim() && (
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "24px 0" }}>
          Busca un alimento para anadir al registro.
        </p>
      )}
    </div>
  );
}
