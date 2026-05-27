import { useState, useEffect } from "react";
import { TRACKER_FOODS } from "../../data/calorieTrackerFoods";
import {
  sumMealTotals, getTodayCET, TARGETS, macroScale,
  type LoggedMeal, type MacroTotals, type LoggedFoodItem,
} from "./types";
import { api } from "../../api/client";

// ─── Macro progress bar ───────────────────────────────────────────
function MacroBar({
  label, consumed, target, unit, danger,
}: {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  danger?: boolean;
}) {
  const pct = Math.min((consumed / target) * 100, 100);
  const over = consumed > target;
  const near = consumed > target * 0.9;
  const color = over
    ? "#e57373"
    : danger && near
    ? "#ffb74d"
    : over
    ? "#e57373"
    : "var(--green)";

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
        <span style={{ fontWeight: 600, color: "var(--ink)" }}>{label}</span>
        <span style={{ color: "var(--muted)" }}>
          {Math.round(consumed * 10) / 10}{unit} / {target}{unit}
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─── Meal card ────────────────────────────────────────────────────
function MealCard({
  meal, expanded, onToggle, onEdit, onDelete,
}: {
  meal: LoggedMeal;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = meal.totals;
  return (
    <div style={{
      background: "var(--cream)",
      borderRadius: 10,
      border: "1px solid var(--border)",
      marginBottom: 8,
      overflow: "hidden",
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
              { label: "Kcal", val: Math.round(t.kcal) },
              { label: "Proteina", val: `${Math.round(t.protein * 10) / 10}g` },
              { label: "Carbos", val: `${Math.round(t.carbs * 10) / 10}g` },
              { label: "Grasa", val: `${Math.round(t.fat * 10) / 10}g` },
              { label: "Fibra", val: `${Math.round(t.fiber * 10) / 10}g` },
              { label: "Azucar", val: `${Math.round(t.sugar * 10) / 10}g` },
            ].map(({ label, val }) => (
              <div key={label} style={{ background: "var(--beige)", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
                <p style={{ color: "var(--muted)", marginBottom: 2 }}>{label}</p>
                <p style={{ fontWeight: 600, color: "var(--ink)" }}>{val}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              onClick={onEdit}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--beige)",
                fontSize: 12, cursor: "pointer", color: "var(--ink)",
              }}
            >
              Editar
            </button>
            <button
              onClick={onDelete}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 8,
                border: "none", background: "#fde8e8",
                fontSize: 12, cursor: "pointer", color: "#c62828", fontWeight: 600,
              }}
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Edit modal ───────────────────────────────────────────────────
function EditMealModal({
  meal, onSave, onClose,
}: {
  meal: LoggedMeal;
  onSave: (updated: LoggedMeal) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<LoggedFoodItem[]>(meal.items.map((i) => ({ ...i })));
  const [time, setTime] = useState(meal.time);

  function handleWeightChange(idx: number, raw: string) {
    const w = parseFloat(raw);
    if (isNaN(w) || w <= 0) return;
    const food = TRACKER_FOODS.find((f) => f.id === items[idx].foodId);
    const updated = items.map((item, i) => {
      if (i !== idx) return item;
      if (food) {
        const scaled = macroScale(food, w);
        return { ...item, weight_g: w, ...scaled };
      }
      const ratio = w / item.weight_g;
      return {
        ...item,
        weight_g: w,
        kcal:    Math.round(item.kcal    * ratio * 10) / 10,
        protein: Math.round(item.protein * ratio * 10) / 10,
        carbs:   Math.round(item.carbs   * ratio * 10) / 10,
        fat:     Math.round(item.fat     * ratio * 10) / 10,
        fiber:   Math.round(item.fiber   * ratio * 10) / 10,
        sugar:   Math.round(item.sugar   * ratio * 10) / 10,
      };
    });
    setItems(updated);
  }

  function handleRemoveItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function handleSave() {
    const totals: MacroTotals = items.reduce(
      (acc, item) => ({
        kcal:    acc.kcal    + item.kcal,
        protein: acc.protein + item.protein,
        carbs:   acc.carbs   + item.carbs,
        fat:     acc.fat     + item.fat,
        fiber:   acc.fiber   + item.fiber,
        sugar:   acc.sugar   + item.sugar,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
    );
    onSave({ ...meal, time, items, totals });
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100,
    }}>
      <div style={{
        background: "var(--cream)", borderRadius: "14px 14px 0 0",
        padding: 20, width: "100%", maxWidth: 600, maxHeight: "80vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>Editar registro</p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--muted)" }}>x</button>
        </div>

        <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Hora</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={{
            width: "100%", padding: "8px 10px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--beige)",
            fontSize: 13, marginBottom: 14, fontFamily: "inherit",
          }}
        />

        {items.map((item, idx) => (
          <div key={idx} style={{
            background: "var(--beige)", borderRadius: 8, padding: 10, marginBottom: 8,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{item.name}</span>
              {items.length > 1 && (
                <button
                  onClick={() => handleRemoveItem(idx)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#c62828" }}
                >
                  x
                </button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                min={1}
                max={2000}
                defaultValue={item.weight_g}
                onBlur={(e) => handleWeightChange(idx, e.target.value)}
                style={{
                  width: 80, padding: "6px 8px", borderRadius: 6,
                  border: "1px solid var(--border)", background: "var(--cream)",
                  fontSize: 13, fontFamily: "inherit",
                }}
              />
              <span style={{ fontSize: 11, color: "var(--muted)" }}>g</span>
              <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>
                {Math.round(item.kcal)} kcal · {Math.round(item.protein * 10) / 10}g P
              </span>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "12px 0" }}>
            Sin alimentos. Guarda para eliminar el registro.
          </p>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              border: "1px solid var(--border)", background: "var(--beige)",
              fontSize: 13, cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2, padding: "10px 0", borderRadius: 10,
              border: "none", background: "var(--ink)", color: "var(--cream)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main TodayTab ────────────────────────────────────────────────
export default function TodayTab({ onLogMore }: { onLogMore: () => void }) {
  const [meals, setMeals] = useState<LoggedMeal[]>([]);
  const [gymDay, setGymDay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<LoggedMeal | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const today = getTodayCET();

  useEffect(() => {
    Promise.all([api.getMeals(today), api.getGymDay()])
      .then(([m, g]) => { setMeals(m); setGymDay(g.active); })
      .finally(() => setLoading(false));
  }, [today]);

  const todayMeals = [...meals].sort((a, b) => b.time.localeCompare(a.time));
  const targets = gymDay ? TARGETS.gym : TARGETS.regular;
  const consumed: MacroTotals = sumMealTotals(todayMeals);

  async function handleGymToggle(checked: boolean) {
    setGymDay(checked);
    await api.setGymDay(checked, today);
  }

  async function handleDelete(id: string) {
    await api.deleteMeal(id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
    setConfirmDeleteId(null);
    setExpandedId(null);
  }

  async function handleSaveEdit(updated: LoggedMeal) {
    if (updated.items.length === 0) {
      await api.deleteMeal(updated.id);
      setMeals((prev) => prev.filter((m) => m.id !== updated.id));
    } else {
      await api.updateMeal(updated.id, { items: updated.items, totals: updated.totals, time: updated.time });
      setMeals((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    }
    setEditingMeal(null);
  }

  const [y, mo, d] = today.split("-").map(Number);
  const dateDisplay = new Date(y, mo - 1, d).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 14,
      }}>
        <p style={{ fontSize: 13, color: "var(--muted)", textTransform: "capitalize" }}>
          {dateDisplay}
        </p>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", color: "var(--ink)" }}>
          <input
            type="checkbox"
            checked={gymDay}
            onChange={(e) => handleGymToggle(e.target.checked)}
          />
          Dia de gym
        </label>
      </div>

      <div style={{
        background: "var(--cream)", borderRadius: 12, padding: 14,
        border: "1px solid var(--border)", marginBottom: 16,
      }}>
        <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>
          {gymDay ? "Gym" : "Normal"} · objetivo {targets.kcal} kcal
        </p>
        <MacroBar label="Kcal"     consumed={consumed.kcal}    target={targets.kcal}    unit=" kcal" />
        <MacroBar label="Proteina" consumed={consumed.protein} target={targets.protein} unit="g" />
        <MacroBar label="Carbos"   consumed={consumed.carbs}   target={targets.carbs}   unit="g" />
        <MacroBar label="Grasa"    consumed={consumed.fat}     target={targets.fat}     unit="g" />
        <MacroBar label="Fibra"    consumed={consumed.fiber}   target={targets.fiber}   unit="g" />
        <MacroBar label="Azucar"   consumed={consumed.sugar}   target={targets.sugar}   unit="g" danger />
      </div>

      {loading ? (
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>
          Cargando...
        </p>
      ) : todayMeals.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "16px 0 10px" }}>
          Sin registros hoy.
        </p>
      ) : (
        todayMeals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            expanded={expandedId === meal.id}
            onToggle={() => setExpandedId(expandedId === meal.id ? null : meal.id)}
            onEdit={() => { setEditingMeal(meal); setExpandedId(null); }}
            onDelete={() => setConfirmDeleteId(meal.id)}
          />
        ))
      )}

      <button
        onClick={onLogMore}
        style={{
          width: "100%", padding: "11px 0", marginTop: 4,
          borderRadius: 10, border: "1.5px dashed var(--border)",
          background: "transparent", color: "var(--muted)",
          fontSize: 13, cursor: "pointer",
        }}
      >
        + Registrar comida
      </button>

      {confirmDeleteId && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div style={{
            background: "var(--cream)", borderRadius: 14, padding: 20,
            margin: 16, maxWidth: 320, width: "100%",
          }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Eliminar registro</p>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
              Esta accion no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 8,
                  border: "1px solid var(--border)", background: "var(--beige)",
                  fontSize: 12, cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 8,
                  border: "none", background: "#e57373", color: "#fff",
                  fontSize: 12, cursor: "pointer", fontWeight: 600,
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {editingMeal && (
        <EditMealModal
          meal={editingMeal}
          onSave={handleSaveEdit}
          onClose={() => setEditingMeal(null)}
        />
      )}
    </div>
  );
}
