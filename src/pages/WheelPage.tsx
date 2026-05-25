import { useState } from "react";
import SpinWheel from "../components/SpinWheel";
import {
  WHEEL_STEPS, WHEEL_CATEGORY_META, getWheelItems,
  type WheelCategory, type WheelItem,
} from "../data/foods";

interface Selections {
  [key: string]: WheelItem | undefined;
}

const STEP_LABELS: Record<WheelCategory, string> = {
  protein: "1", veggie: "2", carb: "3", fruit: "4",
};

export default function WheelPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Selections>({});
  const [showSummary, setShowSummary] = useState(false);

  const handleResult = (step: WheelCategory, item: WheelItem) =>
    setSelections((p) => ({ ...p, [step]: item }));

  const nextStep = () => {
    if (currentStep < WHEEL_STEPS.length - 1) setCurrentStep((p) => p + 1);
    else setShowSummary(true);
  };

  const skipStep = () => {
    setSelections((p) => { const n = { ...p }; delete n[WHEEL_STEPS[currentStep]]; return n; });
    if (currentStep < WHEEL_STEPS.length - 1) setCurrentStep((p) => p + 1);
    else setShowSummary(true);
  };

  const prevStep = () => { if (currentStep > 0) setCurrentStep((p) => p - 1); };

  const respin = (si: number) => {
    setShowSummary(false);
    setCurrentStep(si);
    setSelections((p) => { const n = { ...p }; delete n[WHEEL_STEPS[si]]; return n; });
  };

  const reset = () => { setCurrentStep(0); setSelections({}); setShowSummary(false); };

  const currentKey = WHEEL_STEPS[currentStep];
  const currentMeta = WHEEL_CATEGORY_META[currentKey];
  const hasSelection = selections[currentKey] != null;

  const totals = Object.values(selections).reduce(
    (a, s) => s ? { kcal: a.kcal + s.kcal, protein: a.protein + s.protein, carbs: a.carbs + s.carbs, fat: a.fat + s.fat, fiber: a.fiber + s.fiber } : a,
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 110px)" }}>
      {/* Progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "4px 16px 12px", alignItems: "center" }}>
        {WHEEL_STEPS.map((step, i) => {
          const meta = WHEEL_CATEGORY_META[step];
          const done = selections[step] != null;
          const skipped = !done && i < currentStep;
          const active = i === currentStep && !showSummary;
          return (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                onClick={() => { if ((done || skipped) && !showSummary) setCurrentStep(i); }}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: done ? meta.color : active ? "var(--ink)" : "var(--border)",
                  color: active && !done ? "var(--cream)" : "var(--ink)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 600,
                  cursor: done || skipped ? "pointer" : "default",
                  transition: "all 0.2s",
                  border: active ? "2px solid var(--ink)" : "2px solid transparent",
                }}
              >
                {done ? "✓" : skipped ? "–" : STEP_LABELS[step]}
              </div>
              {i < WHEEL_STEPS.length - 1 && (
                <div style={{ width: 24, height: 2, background: done ? meta.color : "var(--border)", borderRadius: 1 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected chips */}
      {Object.keys(selections).some((k) => selections[k]) && !showSummary && (
        <div style={{ display: "flex", gap: 6, padding: "0 12px 10px", flexWrap: "wrap", justifyContent: "center" }}>
          {WHEEL_STEPS.map((step, i) => {
            const sel = selections[step];
            if (!sel) return null;
            const meta = WHEEL_CATEGORY_META[step];
            return (
              <div key={step} style={{
                background: meta.color, borderRadius: 20, padding: "4px 10px",
                fontSize: 11, fontWeight: 500, color: "var(--ink)",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {sel.name}
                <span onClick={() => respin(i)} style={{ cursor: "pointer", fontSize: 13, marginLeft: 2, opacity: 0.6 }}>↻</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main area */}
      <div style={{ flex: 1 }}>
        {!showSummary ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "0 8px" }}>
            <SpinWheel
              key={currentKey}
              category={currentKey}
              items={getWheelItems(currentKey)}
              selected={selections[currentKey] ?? null}
              onResult={(item) => handleResult(currentKey, item)}
            />
          </div>
        ) : (
          <div style={{ padding: "0 4px 8px", animation: "fadeUp 0.4s ease" }}>
            <div style={{ background: "var(--cream)", borderRadius: 20, padding: 20, border: "1px solid var(--border)" }}>
              <p style={{ fontFamily: "'La Belle Aurore', cursive", fontSize: 22, color: "var(--ink)", margin: "0 0 16px", textAlign: "center" }}>
                Tu plato
              </p>

              {WHEEL_STEPS.map((step, i) => {
                const sel = selections[step];
                const meta = WHEEL_CATEGORY_META[step];
                if (!sel) return null;
                return (
                  <div key={step} style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0", borderBottom: "1px solid var(--beige)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0 }}>{sel.name}</p>
                        <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>{sel.portion}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{sel.kcal} kcal</span>
                      <span onClick={() => respin(i)} style={{ cursor: "pointer", fontSize: 16, color: "var(--muted)", opacity: 0.5, padding: "0 4px" }}>↻</span>
                    </div>
                  </div>
                );
              })}

              {/* Totals */}
              <div style={{ paddingTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Total</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{totals.kcal} kcal</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {[
                    { label: "Proteína", value: `${totals.protein.toFixed(1)}g`, color: "var(--green)" },
                    { label: "Carbs",    value: `${totals.carbs.toFixed(1)}g`,   color: "var(--blue)" },
                    { label: "Grasa",    value: `${totals.fat.toFixed(1)}g`,     color: "var(--orange)" },
                    { label: "Fibra",    value: `${totals.fiber.toFixed(1)}g`,   color: "var(--lavender)" },
                  ].map((m, mi) => (
                    <div key={mi} style={{ background: "var(--beige)", borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {totals.kcal > 550 && (
                <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--peach)", borderRadius: 8, fontSize: 12, color: "var(--ink)", borderLeft: "3px solid var(--orange)" }}>
                  ⚠️ Por encima de ~500 kcal. Considera porción más pequeña del carb o proteína.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom buttons — sticky */}
      <div style={{
        position: "sticky", bottom: 0,
        background: "var(--beige)",
        padding: "10px 16px 20px",
        display: "flex", justifyContent: "center", gap: 10,
        borderTop: "1px solid var(--border)",
        marginTop: 8,
      }}>
        {!showSummary ? (
          <>
            {currentStep > 0 && (
              <button onClick={prevStep} style={{ padding: "10px 18px", borderRadius: 24, border: "1px solid var(--border)", background: "var(--cream)", fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>
                ← Atrás
              </button>
            )}
            {currentMeta.skippable && (
              <button onClick={skipStep} style={{ padding: "10px 18px", borderRadius: 24, border: "1px dashed var(--border)", background: "transparent", fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>
                Sin carb
              </button>
            )}
            {hasSelection && (
              <button onClick={nextStep} style={{ padding: "10px 22px", borderRadius: 24, border: "none", background: "var(--ink)", fontSize: 13, fontWeight: 600, color: "var(--cream)" }}>
                {currentStep < WHEEL_STEPS.length - 1 ? "Siguiente →" : "Ver mi plato"}
              </button>
            )}
          </>
        ) : (
          <button onClick={reset} style={{ padding: "10px 24px", borderRadius: 24, border: "none", background: "var(--ink)", fontSize: 14, fontWeight: 600, color: "var(--cream)" }}>
            Nuevo plato
          </button>
        )}
      </div>
    </div>
  );
}
