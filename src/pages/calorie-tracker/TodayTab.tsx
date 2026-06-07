import { useState, useEffect } from "react";
import { TRACKER_FOODS } from "../../data/calorieTrackerFoods";
import {
  sumMealTotals, getTodayCET, getCurrentTimeCET, TARGETS, ACTIVITY_LEVELS, macroScale,
  type LoggedMeal, type MacroTotals, type LoggedFoodItem, type Suggestion, type ActivityLevel,
} from "./types";
import { api } from "../../api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Pencil, Trash2, ChevronDown, ChevronUp, Info } from "lucide-react";

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

// ── Activity selector ───────────────────────────────────────────
function ActivitySelector({
  selected, onChange,
}: {
  selected: ActivityLevel;
  onChange: (level: ActivityLevel) => void;
}) {
  const [showTip, setShowTip] = useState<ActivityLevel | null>(null);
  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5 sm:flex sm:gap-1.5">
        {ACTIVITY_LEVELS.map(({ level, label }) => (
          <div key={level} className="relative flex-1">
            <button
              onClick={() => onChange(level)}
              className="w-full px-2 py-1.5 rounded text-xs font-medium transition min-h-[44px]"
              style={{
                background: selected === level ? "var(--ink)" : "transparent",
                color: selected === level ? "#fff" : "var(--ink)",
                border: `1px solid ${selected === level ? "var(--ink)" : "var(--border-color)"}`,
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span>{label}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTip(showTip === level ? null : level);
                  }}
                  className="bg-transparent border-0 p-0 cursor-pointer ml-0.5"
                >
                  <Info size={12} style={{ color: "inherit" }} />
                </button>
              </div>
            </button>
            {showTip === level && (
              <div
                className="absolute top-full left-0 right-0 mt-1 p-2 rounded text-[10px] leading-tight z-10 shadow-md"
                style={{ background: "var(--ink)", color: "#fff" }}
              >
                {ACTIVITY_LEVELS.find((a) => a.level === level)?.desc}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Compute empty calories ──────────────────────────────────────
function computeEmptyKcal(meals: LoggedMeal[]): number {
  return meals.reduce((total, meal) => {
    return total + meal.items.reduce((itemTotal, item) => {
      const tracker = TRACKER_FOODS.find((f) => f.id === item.foodId);
      if (tracker && tracker.tags.includes("Calorías vacías")) {
        return itemTotal + item.kcal;
      }
      return itemTotal;
    }, 0);
  }, 0);
}

// ── Macro card ───────────────────────────────────────────────────
function MacroCard({
  label, consumed, target, unit, color,
}: {
  label: string;
  consumed: number;
  target?: number;
  unit: string;
  color: string;
}) {
  const hasTarget = target !== undefined && target > 0;
  const pct = hasTarget ? Math.min((consumed / target) * 100, 100) : 0;
  const over = hasTarget && consumed > target;
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
        <p className="text-xl font-bold leading-tight" style={{ color: hasTarget ? "var(--ink)" : color }}>
          {Math.round(consumed)}{unit === " kcal" ? "" : "g"}
        </p>
        {hasTarget && (
          <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-muted)" }}>
            {Math.round(pct)}% of {target}{unit}
          </p>
        )}
        {hasTarget && (
          <div
            className="h-[4px] mt-2 overflow-hidden"
            style={{ background: "var(--border-color)", borderRadius: 2 }}
          >
            <div
              className="h-full transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%`, backgroundColor: barColor, borderRadius: 2 }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Sugar card ──────────────────────────────────────────────────
function SugarCard({ grossSugar, fiberTotal }: { grossSugar: number; fiberTotal: number }) {
  const netSugar = Math.max(0, grossSugar - fiberTotal * 0.5);
  let indicatorColor = "#4ade80"; // green
  if (netSugar >= 25 && netSugar < 50) indicatorColor = "#eab308"; // yellow
  else if (netSugar >= 50) indicatorColor = "#ef4444"; // red

  return (
    <Card>
      <CardContent className="py-3 px-3">
        <p
          className="text-[10px] font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--ink-muted)" }}
        >
          Azúcar Real
        </p>
        <div className="flex justify-between items-center gap-2">
          <div className="flex-1">
            <p className="text-[11px] text-center" style={{ color: "var(--ink-muted)" }}>Bruta</p>
            <p className="text-lg font-bold text-center">{Math.round(grossSugar)}g</p>
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-center" style={{ color: "var(--ink-muted)" }}>Neta (est.)</p>
            <p className="text-lg font-bold text-center">{Math.round(netSugar)}g</p>
          </div>
        </div>
        <div className="h-1 mt-3 rounded-full" style={{ background: indicatorColor }} />
      </CardContent>
    </Card>
  );
}

// ── Glycemic card ───────────────────────────────────────────────
function GlycemicCard({ fiberTotal, carbsTotal }: { fiberTotal: number; carbsTotal: number }) {
  const ratio = carbsTotal > 0 ? (fiberTotal / carbsTotal) * 10 : null;
  const netCarbs = carbsTotal - fiberTotal;

  let ratioColor = "#4ade80";
  if (ratio !== null) {
    if (ratio >= 1.5) ratioColor = "#4ade80";
    else if (ratio >= 1.0) ratioColor = "#eab308";
    else ratioColor = "#ef4444";
  }

  return (
    <Card>
      <CardContent className="py-3 px-3">
        <p
          className="text-[10px] font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--ink-muted)" }}
        >
          Balance Glucémico
        </p>
        <div className="mb-2.5">
          <p className="text-[10px] mb-1" style={{ color: "var(--ink-muted)" }}>Ratio Azúcar-Fibra</p>
          <p className="text-sm font-semibold" style={{ color: ratioColor }}>
            {ratio !== null ? `${Math.round(ratio * 10) / 10} g fibra/10g carbs` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] mb-1" style={{ color: "var(--ink-muted)" }}>Carbos Netos</p>
          <p className="text-lg font-bold">{Math.round(netCarbs)}g</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Source badge ────────────────────────────────────────────────
function SourceBadge({ source }: { source?: string }) {
  if (!source) return <span style={{ color: "var(--ink-muted)" }}>—</span>;
  const colors: Record<string, { bg: string; text: string }> = {
    hardcoded: { bg: "#f5f5f5", text: "#666" },
    off:       { bg: "#dbeafe", text: "#1e40af" },
    haiku:     { bg: "#fef3c7", text: "#92400e" },
  };
  const style = colors[source] ?? { bg: "#f5f5f5", text: "#666" };
  return (
    <span
      className="px-2 py-0.5 rounded text-[9px] font-medium"
      style={{ background: style.bg, color: style.text }}
    >
      {source}
    </span>
  );
}

// ── Meal card (expandable) ─────────────────────────────────────
function MealCard({
  meal, onEdit, onDelete,
}: {
  meal: LoggedMeal;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const t = meal.totals;
  return (
    <Card className="mb-2 overflow-hidden">
      <div
        className="px-4 py-3 flex items-start justify-between gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
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
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
          <Button variant="outline" size="icon-xs" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Pencil size={14} />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-[#c62828] border-[#fde8e8] hover:bg-[#fde8e8]"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border-color)", background: "var(--cream)" }}>
          {/* Item details */}
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-[11px]" style={{ color: "var(--ink)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th className="text-left py-1 pr-2">Alimento</th>
                  <th className="text-right py-1 px-1">Peso</th>
                  <th className="text-right py-1 px-1">kcal</th>
                  <th className="text-right py-1 px-1">P</th>
                  <th className="text-right py-1 px-1">C</th>
                  <th className="text-right py-1 px-1">G</th>
                  <th className="text-right py-1 px-1">F</th>
                  <th className="text-right py-1 px-1">Az</th>
                  <th className="text-right py-1 px-1">Origen</th>
                </tr>
              </thead>
              <tbody>
                {meal.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td className="py-1 pr-2 text-left">{item.name}</td>
                    <td className="text-right py-1 px-1">{Math.round(item.weight_g)}g</td>
                    <td className="text-right py-1 px-1">{Math.round(item.kcal)}</td>
                    <td className="text-right py-1 px-1">{Math.round(item.protein * 10) / 10}</td>
                    <td className="text-right py-1 px-1">{Math.round(item.carbs)}</td>
                    <td className="text-right py-1 px-1">{Math.round(item.fat)}</td>
                    <td className="text-right py-1 px-1">{Math.round(item.fiber * 10) / 10}</td>
                    <td className="text-right py-1 px-1">{Math.round(item.sugar)}</td>
                    <td className="text-right py-1 px-1"><SourceBadge source={item.source} /></td>
                  </tr>
                ))}
                <tr style={{ background: "var(--beige)", fontWeight: "bold" }}>
                  <td className="py-2 pr-2">TOTAL</td>
                  <td className="text-right py-2 px-1">—</td>
                  <td className="text-right py-2 px-1">{Math.round(t.kcal)}</td>
                  <td className="text-right py-2 px-1">{Math.round(t.protein * 10) / 10}</td>
                  <td className="text-right py-2 px-1">{Math.round(t.carbs)}</td>
                  <td className="text-right py-2 px-1">{Math.round(t.fat)}</td>
                  <td className="text-right py-2 px-1">{Math.round(t.fiber * 10) / 10}</td>
                  <td className="text-right py-2 px-1">{Math.round(t.sugar)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Metabolic impact placeholder */}
          <div
            className="px-3 py-4 rounded text-center text-xs"
            style={{ background: "var(--cream)", border: "1px dashed var(--border-color)", color: "var(--ink-muted)" }}
          >
            <p className="font-semibold mb-1">Impacto Metabólico</p>
            <p>Disponible próximamente</p>
          </div>
        </div>
      )}
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
        className="fixed bottom-0 left-1/2 -translate-x-1/2 top-auto rounded-t-[4px] rounded-b-none w-full max-w-[600px] max-h-[80vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
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
                className="w-20 px-2 py-2.5 text-base font-[inherit]"
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
  const [activityLevel, setActivityLevelState] = useState<ActivityLevel>("rest");
  const [loading, setLoading] = useState(true);
  const [editingMeal, setEditingMeal] = useState<LoggedMeal | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(cachedSuggestions ?? []);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const today = getTodayCET();

  // Load activity level from localStorage with date check
  useEffect(() => {
    const stored = localStorage.getItem("calorie_tracker_activity");
    if (stored) {
      try {
        const { level, date } = JSON.parse(stored);
        if (date === today && level) {
          setActivityLevelState(level as ActivityLevel);
        } else {
          setActivityLevelState("rest");
        }
      } catch {
        setActivityLevelState("rest");
      }
    }
  }, [today]);

  function setActivityLevel(level: ActivityLevel) {
    setActivityLevelState(level);
    localStorage.setItem("calorie_tracker_activity", JSON.stringify({ level, date: today }));
  }

  async function fetchSuggestions(currentMeals: LoggedMeal[], actLevel: ActivityLevel) {
    const currentTargets = TARGETS[actLevel];
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
        is_gym_day: actLevel === "high",
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
    api.getMeals(today)
      .then((m) => {
        setMeals(m);
        if (!hasCachedSuggestions) {
          fetchSuggestions(m, activityLevel);
        }
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, activityLevel]);

  const todayMeals = [...meals].sort((a, b) => b.time.localeCompare(a.time));
  const targets = TARGETS[activityLevel];
  const consumed: MacroTotals = sumMealTotals(todayMeals);
  const emptyKcal = computeEmptyKcal(todayMeals);

  async function handleActivityChange(level: ActivityLevel) {
    setActivityLevel(level);
    onSuggestionsInvalidated();
    fetchSuggestions(meals, level);
  }

  async function handleDelete(id: string) {
    await api.deleteMeal(id);
    const newMeals = meals.filter((m) => m.id !== id);
    setMeals(newMeals);
    setConfirmDeleteId(null);
    onSuggestionsInvalidated();
    fetchSuggestions(newMeals, activityLevel);
  }

  async function handleQuickLog(s: Suggestion) {
    const food = TRACKER_FOODS.find((f) => f.id === s.foodId);
    if (!food) return;
    const scaled = macroScale(food, s.weight_g);
    const item: LoggedFoodItem = {
      foodId: s.foodId,
      name: s.name,
      weight_g: s.weight_g,
      source: "hardcoded",
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
    fetchSuggestions(newMeals, activityLevel);
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
    fetchSuggestions(newMeals, activityLevel);
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
    { label: "Vacias",    consumed: emptyKcal,         target: undefined,        unit: " kcal", color: "#ff9800" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <p className="text-[13px] capitalize mb-3" style={{ color: "var(--ink-muted)" }}>
          {dateDisplay}
        </p>
        <ActivitySelector selected={activityLevel} onChange={handleActivityChange} />
      </div>

      {/* Macro card grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 mb-5">
        {macros.map((m) => (
          <MacroCard key={m.label} {...m} />
        ))}
      </div>

      {/* Sugar and Glycemic cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
        <SugarCard grossSugar={consumed.sugar} fiberTotal={consumed.fiber} />
        <GlycemicCard fiberTotal={consumed.fiber} carbsTotal={consumed.carbs} />
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
              onClick={() => fetchSuggestions(meals, activityLevel)}
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
