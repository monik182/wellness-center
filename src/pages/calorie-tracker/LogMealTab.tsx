import { useState, useMemo, useRef, useEffect } from "react";
import { TRACKER_FOODS, PRE_BUILT_MEALS } from "../../data/calorieTrackerFoods";
import {
  getTodayCET, getCurrentTimeCET,
  macroScale, sumTotals,
  type TrackerFood, type LoggedFoodItem, type LoggedMeal, type ChatMessage,
} from "./types";
import { api } from "../../api/client";
import type { CustomFood } from "../../api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Mic, Square, Send, Camera, X as XIcon } from "lucide-react";

export interface SelectorItem {
  foodId: string;
  weight_g: number;
}

interface PendingChatItem {
  foodId: string;
  name: string;
  weight_g: number;
  isMatched: boolean;
  default_weight_g?: number;
  portion?: string;
}

interface Props {
  selectorItems: SelectorItem[];
  setSelectorItems: (items: SelectorItem[]) => void;
  onLogged: () => void;
}

const TIME_SHORTCUTS = [
  { label: "Desayuno (8 AM)", time: "08:00" },
  { label: "Almuerzo (12 PM)", time: "12:00" },
  { label: "Snack (3 PM)", time: "15:00" },
  { label: "Cena (7 PM)", time: "19:00" },
];

export default function LogMealTab({ selectorItems, setSelectorItems, onLogged }: Props) {
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [logView, setLogView] = useState<"chat" | "selector">("chat");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showQuickMeals, setShowQuickMeals] = useState(true);
  const [mealDate, setMealDate] = useState(getTodayCET());
  const [mealTime, setMealTime] = useState(getCurrentTimeCET());
  const [resolvedFoods, setResolvedFoods] = useState<Map<string, TrackerFood>>(new Map());
  const [resolving, setResolving] = useState(false);
  const [pendingChatItems, setPendingChatItems] = useState<PendingChatItem[] | null>(null);
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);

  // Fetch custom foods on mount
  useEffect(() => {
    api.getCustomFoods().then((res) => {
      if (res.success) {
        setCustomFoods(res.foods || []);
      }
    });
  }, []);

  const allFoods = useMemo(() => {
    const customAsTrackerFoods: TrackerFood[] = customFoods.map((cf) => {
      const servingWeight = cf.serving_size_g ?? 100;
      return {
        id: `custom-${cf.id}`,
        name: cf.name,
        group: "Extra",
        defaultWeight_g: servingWeight,
        kcalPer100g: (cf.calories / servingWeight) * 100,
        proteinPer100g: (cf.protein_g / servingWeight) * 100,
        carbsPer100g: (cf.carbs_g / servingWeight) * 100,
        fatPer100g: (cf.fat_g / servingWeight) * 100,
        fiberPer100g: (cf.fiber_g ?? 0) / servingWeight * 100,
        sugarPer100g: (cf.sugar_g / servingWeight) * 100,
        tags: [],
      };
    });
    return [...TRACKER_FOODS, ...customAsTrackerFoods];
  }, [customFoods]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allFoods;
    const q = query.toLowerCase();
    return allFoods.filter((f) => f.name.toLowerCase().includes(q));
  }, [query, allFoods]);

  function addFood(food: TrackerFood) {
    const existing = selectorItems.findIndex((i) => i.foodId === food.id);
    if (existing >= 0) {
      const updated = selectorItems.map((item, idx) =>
        idx === existing ? { ...item, weight_g: item.weight_g + food.defaultWeight_g } : item
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

  async function handleResolveSearch() {
    if (resolving || !query.trim()) return;
    setResolving(true);
    try {
      const resolved = await api.resolveNutrition(query.trim(), 100);
      const id = `resolved-${query.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const syntheticFood: TrackerFood = {
        id,
        name: resolved.name,
        group: "Extra",
        defaultWeight_g: 100,
        kcalPer100g: resolved.per_100g.kcal,
        proteinPer100g: resolved.per_100g.protein,
        carbsPer100g: resolved.per_100g.carbs,
        fatPer100g: resolved.per_100g.fat,
        fiberPer100g: resolved.per_100g.fiber,
        sugarPer100g: resolved.per_100g.sugar,
        tags: [],
      };
      setResolvedFoods((prev) => new Map(prev).set(id, syntheticFood));
      addFood(syntheticFood);
      setQuery("");
    } finally {
      setResolving(false);
    }
  }

  async function handleImageSend(imageDataUrl: string, mimeType: string, text: string) {
    const userMsg: ChatMessage = { role: "user", content: text || "(imagen)", image: imageDataUrl };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const result = await api.analyzeImage(imageDataUrl, mimeType, allFoods);
      if (result.type === "food" && result.success && result.detected_items) {
        const pending: PendingChatItem[] = await Promise.all(
          result.detected_items.map(async (item) => {
            const food = TRACKER_FOODS.find((f) => f.id === item.name.toLowerCase());
            if (food) {
              return {
                foodId: food.id,
                name: food.name,
                weight_g: item.weight_g,
                isMatched: true,
                default_weight_g: food.defaultWeight_g,
                portion: undefined,
              };
            }
            const resolved = await api.resolveNutrition(item.name, item.weight_g);
            return {
              foodId: item.name,
              name: resolved.name,
              weight_g: item.weight_g,
              isMatched: false,
              default_weight_g: resolved.default_weight_g,
              portion: resolved.portion,
            };
          })
        );
        setPendingChatItems(pending);
        setChatHistory([...newHistory, { role: "assistant", content: "Confirma o ajusta los pesos antes de registrar:" }]);
      } else if (result.type === "label" && result.success && result.extracted) {
        const extracted = result.extracted;
        const msg = `Etiqueta detectada: ${extracted.product_name || "sin nombre"}${extracted.serving_size ? ` (${extracted.serving_size})` : ""} - ${extracted.calories} kcal. Disponible próximamente.`;
        setChatHistory([...newHistory, { role: "assistant", content: msg }]);
      } else if (result.type === "barcode") {
        setChatHistory([...newHistory, { role: "assistant", content: result.message }]);
      } else {
        const errorMsg = result.type === "food" || result.type === "label"
          ? "No se pudo procesar la imagen. Intenta de nuevo."
          : "Error desconocido.";
        setChatHistory([...newHistory, { role: "assistant", content: errorMsg }]);
      }
    } catch (err) {
      setChatHistory([...newHistory, { role: "assistant", content: "Error al procesar la imagen." }]);
    } finally {
      setChatLoading(false);
    }
  }

  const foodById = useMemo(() => {
    const map = new Map<string, TrackerFood>();
    allFoods.forEach((f) => map.set(f.id, f));
    resolvedFoods.forEach((f, id) => map.set(id, f));
    return map;
  }, [allFoods, resolvedFoods]);

  function buildLoggedItems(): LoggedFoodItem[] {
    return selectorItems.map((sel) => {
      const food = foodById.get(sel.foodId)!;
      return { foodId: sel.foodId, name: food.name, weight_g: sel.weight_g, ...macroScale(food, sel.weight_g) };
    });
  }

  async function handleLog() {
    if (selectorItems.length === 0 || saving) return;
    setSaving(true);
    const items = buildLoggedItems();
    const totals = sumTotals(items);
    const meal: LoggedMeal = {
      id: crypto.randomUUID(),
      date: mealDate,
      time: mealTime,
      items,
      totals,
    };
    await api.addMeal(meal);
    setSaving(false);
    setSelectorItems([]);
    onLogged();
  }

  const runningTotals = useMemo(() => {
    const items = buildLoggedItems();
    return sumTotals(items);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectorItems]);

  async function handleChatSend() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput("");
    setChatLoading(true);

    const uncertaintyKeywords = ["no sé", "no se", "no estoy segura", "no estoy seguro", "no sé cuánto", "no se cuanto"];
    const userIsUncertain = uncertaintyKeywords.some((kw) => chatInput.toLowerCase().includes(kw));

    try {
      const result = await api.chat(
        newHistory,
        TRACKER_FOODS.map((f) => ({ id: f.id, name: f.name, defaultWeight_g: f.defaultWeight_g }))
      );
      if (result.type === "items") {
        const pending: PendingChatItem[] = await Promise.all(
          result.items.map(async (item) => {
            const food = TRACKER_FOODS.find((f) => f.id === item.foodId);
            if (food) {
              return {
                foodId: item.foodId,
                name: item.name,
                weight_g: userIsUncertain ? food.defaultWeight_g : item.weight_g,
                isMatched: true,
                default_weight_g: food.defaultWeight_g,
                portion: undefined,
              };
            }
            const resolved = await api.resolveNutrition(item.name, item.weight_g);
            return {
              foodId: item.foodId,
              name: resolved.name,
              weight_g: userIsUncertain ? (resolved.default_weight_g ?? item.weight_g) : item.weight_g,
              isMatched: false,
              default_weight_g: resolved.default_weight_g,
              portion: resolved.portion,
            };
          })
        );
        setPendingChatItems(pending);
        setChatHistory([...newHistory, { role: "assistant", content: "Confirma o ajusta los pesos antes de registrar:" }]);
      } else {
        setChatHistory([...newHistory, { role: "assistant", content: result.text }]);
      }
    } finally {
      setChatLoading(false);
    }
  }

  async function handleChatConfirm() {
    if (!pendingChatItems || pendingChatItems.length === 0 || saving) return;
    setSaving(true);
    try {
      const loggedItems: LoggedFoodItem[] = await Promise.all(
        pendingChatItems.map(async (item) => {
          const food = TRACKER_FOODS.find((f) => f.id === item.foodId);
          if (food) {
            return {
              foodId: item.foodId,
              name: item.name,
              weight_g: item.weight_g,
              source: "hardcoded",
              ...macroScale(food, item.weight_g),
            };
          }
          const resolved = await api.resolveNutrition(item.name, item.weight_g);
          return {
            foodId: `resolved-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            name: resolved.name,
            weight_g: item.weight_g,
            source: resolved.source,
            ...resolved.macros,
          };
        })
      );
      const totals = sumTotals(loggedItems);
      const meal: LoggedMeal = {
        id: crypto.randomUUID(),
        date: mealDate,
        time: mealTime,
        items: loggedItems,
        totals,
      };
      await api.addMeal(meal);
      onLogged();
      setSelectorItems([]);
      const names = pendingChatItems.map((i) => `${i.name} (${i.weight_g}g)`).join(", ");
      setChatHistory((prev) => [...prev, { role: "assistant", content: `Registrado: ${names}` }]);
      setPendingChatItems(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Segment control */}
      <div
        className="flex p-1 mb-5 rounded-[4px]"
        style={{ background: "var(--beige)" }}
      >
        {(["Chat", "Selector"] as const).map((label) => {
          const modeValue = label === "Chat" ? "chat" : "selector";
          const active = logView === modeValue;
          return (
            <button
              key={modeValue}
              onClick={() => setLogView(modeValue)}
              className={cn(
                "flex-1 py-2 text-xs font-[inherit] cursor-pointer transition-all border-0 rounded-[4px]",
                active
                  ? "bg-[var(--cream)] shadow-sm font-semibold"
                  : "bg-transparent font-normal",
              )}
              style={{ color: active ? "var(--ink)" : "var(--ink-muted)" }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Date/time picker */}
      <Card className="mb-5">
        <CardContent className="pt-4 pb-4">
          <p className="text-[13px] font-semibold mb-3" style={{ color: "var(--ink)" }}>
            Cuando comiste esto?
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="date"
              value={mealDate}
              onChange={(e) => setMealDate(e.target.value)}
              className="flex-1 px-2.5 py-2 text-[13px] font-[inherit]"
              style={{
                border: "1px solid var(--border-color)",
                background: "var(--cream)",
                color: "var(--ink)",
              }}
            />
            <input
              type="time"
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              className="w-28 px-2.5 py-2 text-[13px] font-[inherit]"
              style={{
                border: "1px solid var(--border-color)",
                background: "var(--cream)",
                color: "var(--ink)",
              }}
            />
          </div>
          <p className="text-[11px] mb-2" style={{ color: "var(--ink-muted)" }}>
            O elige una hora:
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {TIME_SHORTCUTS.map((s) => (
              <Button
                key={s.time}
                variant="outline"
                size="sm"
                className="text-[11px]"
                onClick={() => setMealTime(s.time)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {logView === "chat" ? (
        <>
          <ChatView
            history={chatHistory}
            input={chatInput}
            loading={chatLoading}
            onSend={handleChatSend}
            onInputChange={setChatInput}
            onSendImage={handleImageSend}
            imageLoading={chatLoading}
          />
          {pendingChatItems && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--ink-muted)" }}>
                CONFIRMAR PESOS
              </p>
              {pendingChatItems.map((item, idx) => (
                <Card key={idx} className="mb-2">
                  <CardContent className="pt-2.5 pb-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="flex-1">
                        <p className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                          {item.name}
                        </p>
                        {item.portion && (
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-muted)" }}>
                            {item.portion}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={2000}
                          value={item.weight_g}
                          onChange={(e) => {
                            const w = parseFloat(e.target.value);
                            if (!isNaN(w) && w > 0) {
                              setPendingChatItems((prev) =>
                                prev!.map((p, i) => i === idx ? { ...p, weight_g: w } : p)
                              );
                            }
                          }}
                          className="w-20 px-2 py-2.5 text-base text-center font-[inherit]"
                          style={{ border: "1px solid var(--border-color)", background: "var(--beige)" }}
                        />
                        <span className="text-[11px]" style={{ color: "var(--ink-muted)" }}>g</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPendingChatItems(null)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-[2]"
                  disabled={saving}
                  onClick={handleChatConfirm}
                >
                  {saving ? "Guardando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Quick meals */}
          {selectorItems.length === 0 && !query.trim() && (
            <div className="mb-3.5">
              <button
                onClick={() => setShowQuickMeals(!showQuickMeals)}
                className="bg-transparent border-0 text-[11px] font-semibold uppercase tracking-[0.04em] cursor-pointer p-0 mb-2 block"
                style={{ color: "var(--ink-muted)" }}
              >
                Comidas rapidas {showQuickMeals ? "-" : "+"}
              </button>
              {showQuickMeals && PRE_BUILT_MEALS.map((meal) => {
                const totalKcal = meal.items.reduce((sum, item) => {
                  const food = foodById.get(item.foodId);
                  return sum + (food ? macroScale(food, item.weight_g).kcal : 0);
                }, 0);
                const totalProtein = meal.items.reduce((sum, item) => {
                  const food = foodById.get(item.foodId);
                  return sum + (food ? macroScale(food, item.weight_g).protein : 0);
                }, 0);
                return (
                  <button
                    key={meal.id}
                    onClick={() => setSelectorItems(meal.items.map((i) => ({ foodId: i.foodId, weight_g: i.weight_g })))}
                    className="flex justify-between items-center w-full px-3 py-2.5 mb-1.5 text-left cursor-pointer border-0"
                    style={{
                      background: "var(--cream)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <p className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{meal.name}</p>
                    <p className="text-[11px] shrink-0 ml-2" style={{ color: "var(--ink-muted)" }}>
                      {Math.round(totalKcal)} kcal · {Math.round(totalProtein)}g P
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search */}
          <Input
            type="search"
            placeholder="Buscar alimento..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mb-2.5 text-[13px]"
            style={{ background: "var(--cream)" }}
          />

          {/* Food list */}
          {query.trim() && (
            <Card className="mb-3.5 max-h-[220px] overflow-y-auto overscroll-contain">
              {filtered.length === 0 ? (
                <div className="px-3.5 py-3">
                  <p className="text-xs mb-2.5" style={{ color: "var(--ink-muted)" }}>Sin resultados.</p>
                  <button
                    disabled={resolving}
                    onClick={handleResolveSearch}
                    className="w-full px-2.5 py-2 text-[12px] font-medium rounded-[4px] cursor-pointer border-0 transition-all"
                    style={{
                      background: "var(--blue)",
                      color: "white",
                      opacity: resolving ? 0.6 : 1,
                    }}
                  >
                    {resolving ? "Buscando..." : `Buscar valores para "${query.trim()}"`}
                  </button>
                </div>
              ) : (
                filtered.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => { addFood(food); setQuery(""); }}
                    className="flex justify-between items-center w-full px-3.5 py-2.5 bg-transparent border-0 cursor-pointer text-left"
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <div>
                      <p className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{food.name}</p>
                      <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                        por 100g: {food.kcalPer100g} kcal · {food.proteinPer100g}g P
                      </p>
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 shrink-0 ml-2"
                      style={{ background: "var(--beige)", color: "var(--ink-muted)", borderRadius: 20 }}
                    >
                      {food.group}
                    </span>
                  </button>
                ))
              )}
            </Card>
          )}

          {/* Selected items */}
          {selectorItems.length > 0 && (
            <>
              <p className="text-[11px] font-semibold mb-2" style={{ color: "var(--ink-muted)" }}>
                SELECCIONADOS
              </p>
              {selectorItems.map((sel, idx) => {
                const food = foodById.get(sel.foodId);
                if (!food) return null;
                const macros = macroScale(food, sel.weight_g);
                return (
                  <Card key={`${sel.foodId}-${idx}`} className="mb-2">
                    <CardContent className="pt-2.5 pb-2.5 flex items-center gap-2.5">
                      <div className="flex-1">
                        <p className="text-[13px] font-medium mb-0.5" style={{ color: "var(--ink)" }}>
                          {food.name}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                          {Math.round(macros.kcal)} kcal · {Math.round(macros.protein * 10) / 10}g P · {Math.round(macros.carbs * 10) / 10}g C
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={2000}
                          value={sel.weight_g}
                          onChange={(e) => updateWeight(idx, e.target.value)}
                          className="w-20 px-2 py-2.5 text-base text-center font-[inherit]"
                          style={{
                            border: "1px solid var(--border-color)",
                            background: "var(--beige)",
                          }}
                        />
                        <span className="text-[11px]" style={{ color: "var(--ink-muted)" }}>g</span>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="bg-transparent border-0 cursor-pointer text-base px-1"
                        style={{ color: "var(--ink-muted)" }}
                      >
                        x
                      </button>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Running totals */}
              <div
                className="grid grid-cols-3 gap-1.5 p-5 mb-4 text-xs"
                style={{ background: "var(--beige)" }}
              >
                {[
                  { label: "Kcal",     val: Math.round(runningTotals.kcal) },
                  { label: "Proteina", val: `${Math.round(runningTotals.protein * 10) / 10}g` },
                  { label: "Carbos",   val: `${Math.round(runningTotals.carbs * 10) / 10}g` },
                  { label: "Grasa",    val: `${Math.round(runningTotals.fat * 10) / 10}g` },
                  { label: "Fibra",    val: `${Math.round(runningTotals.fiber * 10) / 10}g` },
                  { label: "Azucar",   val: `${Math.round(runningTotals.sugar * 10) / 10}g` },
                ].map(({ label, val }) => (
                  <div key={label} className="text-center">
                    <p className="text-[10px]" style={{ color: "var(--ink-muted)" }}>{label}</p>
                    <p className="font-semibold" style={{ color: "var(--ink)" }}>{val}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectorItems([])}>
                  Limpiar
                </Button>
                <Button
                  className="flex-[2]"
                  disabled={saving}
                  onClick={handleLog}
                >
                  {saving ? "Guardando..." : "Agregar al registro"}
                </Button>
              </div>
            </>
          )}

          {selectorItems.length === 0 && !query.trim() && (
            <p className="text-xs text-center py-6" style={{ color: "var(--ink-muted)" }}>
              Busca un alimento para anadir al registro.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function ChatView({
  history, input, loading, onSend, onInputChange, onSendImage, imageLoading,
}: {
  history: ChatMessage[];
  input: string;
  loading: boolean;
  onSend: () => void;
  onInputChange: (v: string) => void;
  onSendImage: (image: string, mime: string, text: string) => Promise<void>;
  imageLoading: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [pendingImage, setPendingImage] = useState<{ data: string; mime: string } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history.length, loading]);

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recording]);

  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      setRecordingSeconds(0);
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        setTranscribing(true);
        try {
          const result = await api.transcribe(blob);
          onInputChange(result.text);
        } finally {
          setTranscribing(false);
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      // mic permission denied or unavailable
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPendingImage({ data: dataUrl, mime: file.type });
    };
    reader.readAsDataURL(file);
  }

  async function handleSendWithImage() {
    if (!pendingImage) return;
    await onSendImage(pendingImage.data, pendingImage.mime, input);
    setPendingImage(null);
  }

  return (
    <div>
      {/* Chat messages */}
      <div className="min-h-[200px] max-h-[300px] overflow-y-auto mb-3 flex flex-col gap-2.5 overscroll-contain">
        {history.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs py-6" style={{ color: "var(--ink-muted)" }}>
              Describe lo que comiste...
            </p>
          </div>
        ) : (
          history.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%]",
                msg.role === "user" ? "self-end" : "self-start"
              )}
            >
              {msg.image && (
                <img
                  src={msg.image}
                  alt="shared"
                  className="max-w-[200px] rounded-[4px] mb-1.5"
                />
              )}
              <div
                className={cn(
                  "px-3.5 py-2.5 text-[13px] leading-relaxed",
                  msg.role === "user"
                    ? "rounded-[4px] rounded-br-none"
                    : "rounded-[4px] rounded-bl-none shadow-sm"
                )}
                style={{
                  background: msg.role === "user" ? "var(--blue)" : "var(--beige)",
                  color: "var(--ink)",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div
            className="self-start px-3.5 py-2.5 text-xs rounded-[4px] rounded-bl-none"
            style={{ background: "var(--beige)", color: "var(--ink-muted)" }}
          >
            ...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Recording indicator */}
      {(recording || transcribing) && (
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 mb-2 text-xs rounded-[4px]"
          style={{ background: recording ? "#fde8e8" : "var(--beige)" }}
        >
          {recording && (
            <>
              <span
                className="w-2 h-2"
                style={{ borderRadius: "50%", background: "#e53e3e", animation: "pulse 1s ease-in-out infinite" }}
              />
              <span style={{ color: "#c62828" }}>Grabando... {recordingSeconds}s</span>
            </>
          )}
          {transcribing && <span style={{ color: "var(--ink-muted)" }}>Transcribiendo...</span>}
        </div>
      )}

      {/* Image preview */}
      {pendingImage && (
        <div className="mb-2 flex gap-2 items-end">
          <img
            src={pendingImage.data}
            alt="preview"
            className="max-w-[100px] max-h-[100px] rounded-[4px]"
          />
          <button
            onClick={() => setPendingImage(null)}
            className="p-1 border-0 bg-transparent cursor-pointer"
          >
            <XIcon size={16} style={{ color: "var(--ink-muted)" }} />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={input}
          placeholder="Escribe o dicta..."
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !pendingImage && !loading) onSend(); }}
          disabled={loading || transcribing}
          className="flex-1 text-[13px]"
          style={{ background: "var(--cream)" }}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelected}
          className="hidden"
        />
        <Button
          variant="outline"
          size="icon"
          className="size-11"
          onClick={() => imageInputRef.current?.click()}
          disabled={loading || imageLoading}
        >
          <Camera size={16} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={`size-11 ${recording ? "bg-[#e53e3e] text-white border-[#e53e3e]" : ""}`}
          onClick={toggleRecording}
          disabled={loading || transcribing || !!pendingImage}
        >
          {transcribing ? (
            <span className="text-[10px]">...</span>
          ) : recording ? (
            <Square size={14} />
          ) : (
            <Mic size={16} />
          )}
        </Button>
        <Button
          size="icon"
          className="size-11"
          onClick={pendingImage ? handleSendWithImage : onSend}
          disabled={loading || (!input.trim() && !pendingImage)}
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
