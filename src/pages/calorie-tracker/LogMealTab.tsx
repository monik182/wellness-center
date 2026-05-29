import { useState, useMemo, useRef, useEffect } from "react";
import { TRACKER_FOODS, PRE_BUILT_MEALS } from "../../data/calorieTrackerFoods";
import {
  getTodayCET, getCurrentTimeCET,
  macroScale, sumTotals,
  type TrackerFood, type LoggedFoodItem, type LoggedMeal, type ChatMessage,
} from "./types";
import { api } from "../../api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Mic, Square, Send } from "lucide-react";
import PictureLogView from "./PictureLogView";

export interface SelectorItem {
  foodId: string;
  weight_g: number;
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
  const [logView, setLogView] = useState<"chat" | "selector" | "picture">("chat");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showQuickMeals, setShowQuickMeals] = useState(true);
  const [mealDate, setMealDate] = useState(getTodayCET());
  const [mealTime, setMealTime] = useState(getCurrentTimeCET());
  const [resolvedFoods, setResolvedFoods] = useState<Map<string, TrackerFood>>(new Map());
  const [resolving, setResolving] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return TRACKER_FOODS;
    const q = query.toLowerCase();
    return TRACKER_FOODS.filter((f) => f.name.toLowerCase().includes(q));
  }, [query]);

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
        sugarPer100g: 0,
        tags: [],
      };
      setResolvedFoods((prev) => new Map(prev).set(id, syntheticFood));
      addFood(syntheticFood);
      setQuery("");
    } finally {
      setResolving(false);
    }
  }

  const foodById = useMemo(() => {
    const map = new Map<string, TrackerFood>();
    TRACKER_FOODS.forEach((f) => map.set(f.id, f));
    resolvedFoods.forEach((f, id) => map.set(id, f));
    return map;
  }, [resolvedFoods]);

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
    try {
      const result = await api.chat(
        newHistory,
        TRACKER_FOODS.map((f) => ({ id: f.id, name: f.name, defaultWeight_g: f.defaultWeight_g }))
      );
      if (result.type === "items") {
        const loggedItems: LoggedFoodItem[] = await Promise.all(
          result.items.map(async (add) => {
            const food = TRACKER_FOODS.find((f) => f.id === add.foodId);
            if (food) {
              return { foodId: add.foodId, name: add.name, weight_g: add.weight_g, ...macroScale(food, add.weight_g) };
            }
            const resolved = await api.resolveNutrition(add.name, add.weight_g);
            return {
              foodId: `resolved-${add.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              name: resolved.name,
              weight_g: add.weight_g,
              ...resolved.macros,
              sugar: 0,
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
        const names = result.items.map((i) => `${i.name} (${i.weight_g}g)`).join(", ");
        setChatHistory([...newHistory, { role: "assistant", content: `Registrado: ${names}` }]);
      } else {
        setChatHistory([...newHistory, { role: "assistant", content: result.text }]);
      }
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div>
      {/* Segment control */}
      <div
        className="flex p-1 mb-5 rounded-[4px]"
        style={{ background: "var(--beige)" }}
      >
        {(["Chat", "Selector", "Foto"] as const).map((label) => {
          const modeValue = label === "Chat" ? "chat" : label === "Selector" ? "selector" : "picture";
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
        <ChatView
          history={chatHistory}
          input={chatInput}
          loading={chatLoading}
          onSend={handleChatSend}
          onInputChange={setChatInput}
        />
      ) : logView === "picture" ? (
        <PictureLogView
          onLogged={onLogged}
          mealDate={mealDate}
          mealTime={mealTime}
        />
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
            <Card className="mb-3.5 max-h-[220px] overflow-y-auto">
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
                          className="w-16 px-1.5 py-1 text-[13px] text-center font-[inherit]"
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
  history, input, loading, onSend, onInputChange,
}: {
  history: ChatMessage[];
  input: string;
  loading: boolean;
  onSend: () => void;
  onInputChange: (v: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
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

  return (
    <div>
      {/* Chat messages */}
      <div className="min-h-[200px] max-h-[300px] overflow-y-auto mb-3 flex flex-col gap-2.5">
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
                "px-3.5 py-2.5 text-[13px] max-w-[85%] leading-relaxed",
                msg.role === "user"
                  ? "self-end rounded-[4px] rounded-br-none"
                  : "self-start rounded-[4px] rounded-bl-none shadow-sm"
              )}
              style={{
                background: msg.role === "user" ? "var(--blue)" : "var(--beige)",
                color: "var(--ink)",
              }}
            >
              {msg.content}
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

      {/* Input bar */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={input}
          placeholder="Escribe o dicta..."
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
          disabled={loading || transcribing}
          className="flex-1 text-[13px]"
          style={{ background: "var(--cream)" }}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={toggleRecording}
          disabled={loading || transcribing}
          className={recording ? "bg-[#e53e3e] text-white border-[#e53e3e]" : ""}
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
          onClick={onSend}
          disabled={loading || !input.trim()}
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
