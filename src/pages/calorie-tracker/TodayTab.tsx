import { useState, useEffect } from "react";
import { TRACKER_FOODS } from "../../data/calorieTrackerFoods";
import {
  sumMealTotals, getTodayCET, getCurrentTimeCET, TARGETS, macroScale,
  type LoggedMeal, type MacroTotals, type LoggedFoodItem, type Suggestion,
} from "./types";
import { api } from "../../api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

// ── Group emoji map ──────────────────────────────────────────────
const GROUP_EMOJI: Record<string, string> = {
  "Proteína":    "🥩",
  "Carbohidrato": "🍞",
  "Verdura":     "🥬",
  "Fruta":       "🍌",
  "Lácteo":      "🥛",
  "Grasa":       "🥑",
  "Extra":       "🧂",
};

function groupEmoji(group: string): string {
  return GROUP_EMOJI[group] ?? "🍽️";
}

// ── Macro card ───────────────────────────────────────────────────
function MacroCard({
  label, consumed, target, unit, color,
}: {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = Math.min((consumed / target) * 100, 100);
  const over = consumed > target;
  const barColor = over ? "#e57373" : color;

  return (
    <Card>
      <CardContent className="py-3 px-3">
        <p
          className="text-[10px] font-semibold uppercase tracking-wider mb-1"
          style={{ color: "var(--ink-muted)" }}
        >
          {label}
        </p>
        <p className="text-xl font-bold leading-tight" style={{ color: "var(--ink)" }}>
          {Math.round(consumed)}{unit === " kcal" ? "" : "g"}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-muted)" }}>
          {Math.round(pct)}% of {target}{unit}
        </p>
        <div
          className="h-[4px] mt-2 overflow-hidden"
          style={{ background: "var(--border-color)", borderRadius: 2 }}
        >
          <div
            className="h-full transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%`, backgroundColor: barColor, borderRadius: 2 }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Meal card (flat, no expand) ──────────────────────────────────
function MealCard({
  meal, onEdit, onDelete,
}: {
  meal: LoggedMeal;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = meal.totals;
  return (
    <Card className="mb-2 overflow-hidden">
      <div className="px-4 py-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] mb-0.5" style={{ color: "var(--ink-muted)" }}>{meal.time}</p>
          <p className="text-[13px] font-semibold truncate" style={{ color: "var(--ink)" }}>
            {meal.items.map((i) => i.name).join(", ")}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-muted)" }}>
            {Math.round(t.kcal)} kcal · {Math.round(t.protein)}g protein
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0 pt-1">
          <Button variant="outline" size="icon-xs" onClick={onEdit}>
            <Pencil size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={onDelete}
            className="text-[#c62828] border-[#fde8e8] hover:bg-[#fde8e8]"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Edit modal ───────────────────────────────────────────────────
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="fixed bottom-0 left-1/2 -translate-x-1/2 top-auto rounded-t-[4px] rounded-b-none w-full max-w-[600px] max-h-[80vh] overflow-y-auto"
        style={{ transform: "translateX(-50%)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Editar registro</DialogTitle>
        </DialogHeader>

        <label className="block text-[11px] mb-1" style={{ color: "var(--ink-muted)" }}>Hora</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full px-2.5 py-2 text-[13px] mb-3.5 font-[inherit]"
          style={{
            border: "1px solid var(--border-color)",
            background: "var(--beige)",
          }}
        />

        {items.map((item, idx) => (
          <div key={idx} className="px-2.5 py-2.5 mb-2" style={{ background: "var(--beige)" }}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold">{item.name}</span>
              {items.length > 1 && (
                <button
                  onClick={() => handleRemoveItem(idx)}
                  className="bg-transparent border-0 cursor-pointer text-sm"
                  style={{ color: "#c62828" }}
                >
                  x
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={2000}
                defaultValue={item.weight_g}
                onBlur={(e) => handleWeightChange(idx, e.target.value)}
                className="w-20 px-2 py-1.5 text-[13px] font-[inherit]"
                style={{
                  border: "1px solid var(--border-color)",
                  background: "var(--cream)",
                }}
              />
              <span className="text-[11px]" style={{ color: "var(--ink-muted)" }}>g</span>
              <span className="text-[11px] ml-auto" style={{ color: "var(--ink-muted)" }}>
                {Math.round(item.kcal)} kcal · {Math.round(item.protein * 10) / 10}g P
              </span>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-xs text-center py-3" style={{ color: "var(--ink-muted)" }}>
            Sin alimentos. Guarda para eliminar el registro.
          </p>
        )}

        <DialogFooter className="flex gap-2 mt-3.5">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-[2]" onClick={handleSave}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main TodayTab ────────────────────────────────────────────────
interface TodayTabProps {
  onLogMore: () => void;
  cachedSuggestions: Suggestion[] | null;
  onSuggestionsLoaded: (s: Suggestion[]) => void;
  onSuggestionsInvalidated: () => void;
}

export default function TodayTab({
  onLogMore, cachedSuggestions, onSuggestionsLoaded, onSuggestionsInvalidated,
}: TodayTabProps) {
  const [meals, setMeals] = useState<LoggedMeal[]>([]);
  const [gymDay, setGymDay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingMeal, setEditingMeal] = useState<LoggedMeal | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(cachedSuggestions ?? []);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const today = getTodayCET();

  async function fetchSuggestions(currentMeals: LoggedMeal[], isGymDay: boolean) {
    const currentTargets = isGymDay ? TARGETS.gym : TARGETS.regular;
    const currentConsumed = sumMealTotals(currentMeals);
    const remaining = {
      kcal:    currentTargets.kcal    - currentConsumed.kcal,
      protein: currentTargets.protein - currentConsumed.protein,
      carbs:   currentTargets.carbs   - currentConsumed.carbs,
      fat:     currentTargets.fat     - currentConsumed.fat,
      fiber:   currentTargets.fiber   - currentConsumed.fiber,
      sugar:   currentTargets.sugar   - currentConsumed.sugar,
    };
    const meals_today = currentMeals.flatMap((m) => m.items.map((i) => i.name));
    setSuggestionsLoading(true);
    try {
      const result = await api.getSuggestions({
        remaining,
        time: getCurrentTimeCET(),
        is_gym_day: isGymDay,
        meals_today,
        foods: TRACKER_FOODS,
      });
      setSuggestions(result);
      onSuggestionsLoaded(result);
    } finally {
      setSuggestionsLoading(false);
    }
  }

  useEffect(() => {
    const hasCachedSuggestions = cachedSuggestions !== null;
    Promise.all([api.getMeals(today), api.getGymDay()])
      .then(([m, g]) => {
        setMeals(m);
        const isGym = g.active && g.date === today;
        setGymDay(isGym);
        if (g.active && g.date !== today) {
          api.setGymDay(false, today);
        }
        if (!hasCachedSuggestions) {
          fetchSuggestions(m, isGym);
        }
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  const todayMeals = [...meals].sort((a, b) => b.time.localeCompare(a.time));
  const targets = gymDay ? TARGETS.gym : TARGETS.regular;
  const consumed: MacroTotals = sumMealTotals(todayMeals);

  async function handleGymToggle(checked: boolean) {
    setGymDay(checked);
    await api.setGymDay(checked, today);
    onSuggestionsInvalidated();
    fetchSuggestions(meals, checked);
  }

  async function handleDelete(id: string) {
    await api.deleteMeal(id);
    const newMeals = meals.filter((m) => m.id !== id);
    setMeals(newMeals);
    setConfirmDeleteId(null);
    onSuggestionsInvalidated();
    fetchSuggestions(newMeals, gymDay);
  }

  async function handleQuickLog(s: Suggestion) {
    const food = TRACKER_FOODS.find((f) => f.id === s.foodId);
    if (!food) return;
    const scaled = macroScale(food, s.weight_g);
    const item: LoggedFoodItem = {
      foodId: s.foodId,
      name: s.name,
      weight_g: s.weight_g,
      ...scaled,
    };
    const meal: LoggedMeal = {
      id: crypto.randomUUID(),
      date: today,
      time: getCurrentTimeCET(),
      items: [item],
      totals: { ...scaled },
    };
    await api.addMeal(meal);
    const newMeals = [...meals, meal];
    setMeals(newMeals);
    onSuggestionsInvalidated();
    fetchSuggestions(newMeals, gymDay);
  }

  async function handleSaveEdit(updated: LoggedMeal) {
    let newMeals: LoggedMeal[];
    if (updated.items.length === 0) {
      await api.deleteMeal(updated.id);
      newMeals = meals.filter((m) => m.id !== updated.id);
    } else {
      await api.updateMeal(updated.id, { items: updated.items, totals: updated.totals, time: updated.time });
      newMeals = meals.map((m) => (m.id === updated.id ? updated : m));
    }
    setMeals(newMeals);
    setEditingMeal(null);
    onSuggestionsInvalidated();
    fetchSuggestions(newMeals, gymDay);
  }

  const [y, mo, d] = today.split("-").map(Number);
  const dateDisplay = new Date(y, mo - 1, d).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const macros = [
    { label: "Calorias",  consumed: consumed.kcal,    target: targets.kcal,    unit: " kcal", color: "var(--macro-kcal)" },
    { label: "Proteina",  consumed: consumed.protein,  target: targets.protein,  unit: "g",     color: "var(--macro-protein)" },
    { label: "Carbos",    consumed: consumed.carbs,    target: targets.carbs,    unit: "g",     color: "var(--macro-carbs)" },
    { label: "Grasa",     consumed: consumed.fat,      target: targets.fat,      unit: "g",     color: "var(--macro-fat)" },
    { label: "Fibra",     consumed: consumed.fiber,    target: targets.fiber,    unit: "g",     color: "var(--macro-fiber)" },
    { label: "Azucar",    consumed: consumed.sugar,    target: targets.sugar,    unit: "g",     color: "var(--macro-sugar)" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <p className="text-[13px] capitalize" style={{ color: "var(--ink-muted)" }}>
          {dateDisplay}
        </p>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "var(--ink)" }}>
          <input
            type="checkbox"
            checked={gymDay}
            onChange={(e) => handleGymToggle(e.target.checked)}
          />
          Dia de gym
        </label>
      </div>

      {/* Macro card grid */}
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        {macros.map((m) => (
          <MacroCard key={m.label} {...m} />
        ))}
      </div>

      {/* Logged meals */}
      {loading ? (
        <p className="text-xs text-center py-4" style={{ color: "var(--ink-muted)" }}>Cargando...</p>
      ) : todayMeals.length === 0 ? (
        <p className="text-xs text-center py-4 pb-2.5" style={{ color: "var(--ink-muted)" }}>Sin registros hoy.</p>
      ) : (
        todayMeals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onEdit={() => setEditingMeal(meal)}
            onDelete={() => setConfirmDeleteId(meal.id)}
          />
        ))
      )}

      {/* Log more button */}
      <Button
        variant="outline"
        className="w-full mt-1 mb-5 border-dashed"
        onClick={onLogMore}
      >
        + Registrar comida →
      </Button>

      {/* Suggestions */}
      {!loading && (
        <div
          className="rounded-[4px] p-4 mb-5"
          style={{ background: "var(--suggestion-bg)" }}
        >
          <div className="flex justify-between items-center mb-3">
            <p className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
              Sugerencias para el resto del dia
            </p>
            <button
              onClick={() => fetchSuggestions(meals, gymDay)}
              disabled={suggestionsLoading}
              className="bg-transparent border-0 text-[11px] cursor-pointer p-0"
              style={{ color: "var(--ink-muted)" }}
            >
              {suggestionsLoading ? "..." : "Actualizar"}
            </button>
          </div>

          {suggestionsLoading ? (
            <p className="text-xs text-center py-2" style={{ color: "var(--ink-muted)" }}>Calculando...</p>
          ) : suggestions.length === 0 ? (
            <p className="text-xs text-center py-2" style={{ color: "var(--ink-muted)" }}>Sin sugerencias.</p>
          ) : (
            suggestions.map((s) => {
              const food = TRACKER_FOODS.find((f) => f.id === s.foodId);
              const macrosData = food ? macroScale(food, s.weight_g) : null;
              const emoji = food ? groupEmoji(food.group) : "🍽️";
              return (
                <div
                  key={s.foodId}
                  className="flex items-start gap-3 py-2.5"
                  style={{ borderTop: "1px solid var(--border-color)" }}
                >
                  <span className="text-base mt-0.5 shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                      {s.name}
                      {macrosData && (
                        <span className="font-normal ml-1" style={{ color: "var(--ink-muted)" }}>
                          ({Math.round(macrosData.kcal)} kcal, {Math.round(macrosData.protein)}g protein)
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-muted)" }}>{s.reason}</p>
                  </div>
                  {food && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 px-2 py-1 h-auto text-xs"
                      onClick={() => handleQuickLog(s)}
                    >
                      +
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Confirm delete dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent className="mx-4 max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Eliminar registro</DialogTitle>
            <DialogDescription className="text-xs" style={{ color: "var(--ink-muted)" }}>
              Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              className="flex-1 font-semibold"
              style={{ background: "#e57373", color: "#fff", border: "none" }}
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
