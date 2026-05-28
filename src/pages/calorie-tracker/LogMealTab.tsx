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
  const [saving, setSaving] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showQuickMeals, setShowQuickMeals] = useState(true);

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

  function buildLoggedItems(): LoggedFoodItem[] {
    return selectorItems.map((sel) => {
      const food = TRACKER_FOODS.find((f) => f.id === sel.foodId)!;
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
      date: getTodayCET(),
      time: getCurrentTimeCET(),
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

  const foodById = useMemo(() => {
    const map = new Map<string, TrackerFood>();
    TRACKER_FOODS.forEach((f) => map.set(f.id, f));
    return map;
  }, []);

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
        const loggedItems: LoggedFoodItem[] = result.items.map((add) => {
          const food = TRACKER_FOODS.find((f) => f.id === add.foodId)!;
          return { foodId: add.foodId, name: add.name, weight_g: add.weight_g, ...macroScale(food, add.weight_g) };
        });
        const totals = sumTotals(loggedItems);
        const meal: LoggedMeal = {
          id: crypto.randomUUID(),
          date: getTodayCET(),
          time: getCurrentTimeCET(),
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
      {/* Mode toggle */}
      <div className="flex gap-1.5 mb-5">
        {(["Selector", "Chat"] as const).map((mode) => {
          const active = (mode === "Chat") === chatMode;
          return (
            <button
              key={mode}
              onClick={() => setChatMode(mode === "Chat")}
              className={cn(
                "flex-1 py-2 text-xs font-[inherit] cursor-pointer transition-all",
                active
                  ? "bg-[var(--ink)] text-[var(--cream)] font-semibold border-0"
                  : "border border-[var(--border-color)] bg-[var(--beige)] font-normal",
              )}
              style={{ color: active ? undefined : "var(--ink-muted)" }}
            >
              {mode}
            </button>
          );
        })}
      </div>

      {chatMode ? (
        <ChatView
          history={chatHistory}
          input={chatInput}
          loading={chatLoading}
          onSend={handleChatSend}
          onInputChange={setChatInput}
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
                <p className="text-xs px-3.5 py-3" style={{ color: "var(--ink-muted)" }}>Sin resultados.</p>
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
      <div
        className="min-h-[180px] max-h-[280px] overflow-y-auto mb-3 flex flex-col gap-2"
      >
        {history.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: "var(--ink-muted)" }}>
            Describe lo que comiste...
          </p>
        ) : (
          history.map((msg, i) => (
            <div
              key={i}
              className="px-3 py-2 text-[13px] max-w-[80%]"
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                background: msg.role === "user" ? "var(--ink)" : "var(--beige)",
                color: msg.role === "user" ? "var(--cream)" : "var(--ink)",
              }}
            >
              {msg.content}
            </div>
          ))
        )}
        {loading && (
          <div className="self-start text-xs py-1" style={{ color: "var(--ink-muted)" }}>...</div>
        )}
        <div ref={chatEndRef} />
      </div>

      {(recording || transcribing) && (
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 mb-2 text-xs"
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

      <div className="flex gap-2">
        <Input
          type="text"
          value={input}
          placeholder="2 huevos y avena..."
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
          disabled={loading || transcribing}
          className="flex-1 text-[13px]"
          style={{ background: "var(--cream)" }}
        />
        <button
          onClick={toggleRecording}
          disabled={loading || transcribing}
          title={recording ? "Detener grabacion" : "Grabar voz"}
          className="px-3 py-2 text-base shrink-0 border cursor-pointer"
          style={{
            background: recording ? "#e53e3e" : "var(--beige)",
            color: recording ? "white" : "var(--ink-muted)",
            borderColor: "var(--border-color)",
          }}
        >
          {transcribing ? "..." : recording ? "\u25A0" : "\uD83C\uDF99\uFE0F"}
        </button>
        <Button
          onClick={onSend}
          disabled={loading || !input.trim()}
        >
          Enviar
        </Button>
      </div>
    </div>
  );
}
