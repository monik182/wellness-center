import { useState, useMemo, useRef, useEffect } from "react";
import { TRACKER_FOODS, PRE_BUILT_MEALS } from "../../data/calorieTrackerFoods";
import {
  getTodayCET, getCurrentTimeCET,
  macroScale, sumTotals,
  type TrackerFood, type LoggedFoodItem, type LoggedMeal, type ChatMessage,
} from "./types";
import { api } from "../../api/client";

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
          return {
            foodId: add.foodId,
            name: add.name,
            weight_g: add.weight_g,
            ...macroScale(food, add.weight_g),
          };
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
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {(["Selector", "Chat"] as const).map((mode) => {
          const active = (mode === "Chat") === chatMode;
          return (
            <button
              key={mode}
              onClick={() => setChatMode(mode === "Chat")}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 8,
                border: active ? "none" : "1px solid var(--border)",
                background: active ? "var(--ink)" : "var(--beige)",
                color: active ? "var(--cream)" : "var(--muted)",
                fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer",
              }}
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
            <div style={{ marginBottom: 14 }}>
              <button
                onClick={() => setShowQuickMeals(!showQuickMeals)}
                style={{
                  background: "none", border: "none", fontSize: 11, fontWeight: 600,
                  color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em",
                  cursor: "pointer", padding: 0, marginBottom: 8, display: "block",
                }}
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
                    onClick={() => {
                      setSelectorItems(meal.items.map((i) => ({ foodId: i.foodId, weight_g: i.weight_g })));
                    }}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      width: "100%", padding: "10px 12px", background: "var(--cream)",
                      border: "1px solid var(--border)", borderRadius: 10,
                      cursor: "pointer", textAlign: "left", marginBottom: 6,
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{meal.name}</p>
                    <p style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0, marginLeft: 8 }}>
                      {Math.round(totalKcal)} kcal · {Math.round(totalProtein)}g P
                    </p>
                  </button>
                );
              })}
            </div>
          )}

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
                  disabled={saving}
                  style={{
                    flex: 2, padding: "10px 0", borderRadius: 10,
                    border: "none", background: saving ? "var(--muted)" : "var(--ink)", color: "var(--cream)",
                    fontSize: 13, fontWeight: 600, cursor: saving ? "default" : "pointer",
                  }}
                >
                  {saving ? "Guardando..." : "Agregar al registro"}
                </button>
              </div>
            </>
          )}

          {selectorItems.length === 0 && !query.trim() && (
            <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "24px 0" }}>
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
      <div style={{
        minHeight: 180, maxHeight: 280, overflowY: "auto",
        marginBottom: 12, display: "flex", flexDirection: "column", gap: 8,
      }}>
        {history.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "24px 0" }}>
            Describe lo que comiste...
          </p>
        ) : (
          history.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "var(--ink)" : "var(--beige)",
              color: msg.role === "user" ? "var(--cream)" : "var(--ink)",
              borderRadius: 10, padding: "8px 12px",
              fontSize: 13, maxWidth: "80%",
            }}>
              {msg.content}
            </div>
          ))
        )}
        {loading && (
          <div style={{ alignSelf: "flex-start", fontSize: 12, color: "var(--muted)", padding: "4px 0" }}>
            ...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {(recording || transcribing) && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 10px", marginBottom: 8,
          background: recording ? "#fde8e8" : "var(--beige)",
          borderRadius: 8, fontSize: 12,
        }}>
          {recording && (
            <>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", background: "#e53e3e",
                animation: "pulse 1s ease-in-out infinite",
              }} />
              <span style={{ color: "#c62828" }}>
                Grabando... {recordingSeconds}s
              </span>
            </>
          )}
          {transcribing && (
            <span style={{ color: "var(--muted)" }}>Transcribiendo...</span>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={input}
          placeholder="2 huevos y avena..."
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
          disabled={loading || transcribing}
          style={{
            flex: 1, padding: "10px 12px", borderRadius: 10,
            border: "1px solid var(--border)", background: "var(--cream)",
            fontSize: 13, fontFamily: "inherit", outline: "none",
          }}
        />
        <button
          onClick={toggleRecording}
          disabled={loading || transcribing}
          title={recording ? "Detener grabacion" : "Grabar voz"}
          style={{
            padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)",
            background: recording ? "#e53e3e" : "var(--beige)",
            color: recording ? "white" : "var(--muted)",
            fontSize: 16, cursor: loading || transcribing ? "default" : "pointer", flexShrink: 0,
          }}
        >
          {transcribing ? "..." : recording ? "\u25A0" : "\uD83C\uDF99\uFE0F"}
        </button>
        <button
          onClick={onSend}
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 16px", borderRadius: 10, border: "none",
            background: loading || !input.trim() ? "var(--muted)" : "var(--ink)",
            color: "var(--cream)", fontSize: 13, fontWeight: 600,
            cursor: loading || !input.trim() ? "default" : "pointer",
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
