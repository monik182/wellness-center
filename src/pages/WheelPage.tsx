import { useState } from "react";
import SpinWheel from "../components/SpinWheel";
import {
  WHEEL_STEPS, WHEEL_CATEGORY_META, getWheelItems,
  type WheelCategory, type WheelItem,
} from "../data/foods";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 110px)" }}>
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 px-4 pt-2 pb-4 items-center">
        {WHEEL_STEPS.map((step, i) => {
          const meta = WHEEL_CATEGORY_META[step];
          const done = selections[step] != null;
          const skipped = !done && i < currentStep;
          const active = i === currentStep && !showSummary;
          return (
            <div key={step} className="flex items-center gap-1.5">
              <div
                onClick={() => { if ((done || skipped) && !showSummary) setCurrentStep(i); }}
                className="w-8 h-8 flex items-center justify-center text-[13px] font-semibold transition-all duration-200"
                style={{
                  borderRadius: "50%",
                  background: done ? meta.color : active ? "var(--ink)" : "var(--border-color)",
                  color: active && !done ? "var(--cream)" : "var(--ink)",
                  cursor: done || skipped ? "pointer" : "default",
                  border: active ? "2px solid var(--ink)" : "2px solid transparent",
                }}
              >
                {done ? "✓" : skipped ? "–" : STEP_LABELS[step]}
              </div>
              {i < WHEEL_STEPS.length - 1 && (
                <div className="w-6 h-0.5" style={{ background: done ? meta.color : "var(--border-color)" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected chips */}
      {Object.keys(selections).some((k) => selections[k]) && !showSummary && (
        <div className="flex gap-1.5 px-3 pb-4 flex-wrap justify-center">
          {WHEEL_STEPS.map((step, i) => {
            const sel = selections[step];
            if (!sel) return null;
            const meta = WHEEL_CATEGORY_META[step];
            return (
              <div
                key={step}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium"
                style={{ background: meta.color, borderRadius: 20, color: "var(--ink)" }}
              >
                {sel.name}
                <span onClick={() => respin(i)} className="cursor-pointer text-[13px] ml-0.5 opacity-60">↻</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main area */}
      <div className="flex-1">
        {!showSummary ? (
          <div className="flex justify-center px-2">
            <SpinWheel
              key={currentKey}
              category={currentKey}
              items={getWheelItems(currentKey)}
              selected={selections[currentKey] ?? null}
              onResult={(item) => handleResult(currentKey, item)}
            />
          </div>
        ) : (
          <div className="px-1 pb-2" style={{ animation: "fadeUp 0.4s ease" }}>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-center mb-4" style={{ fontFamily: "'La Belle Aurore', cursive", fontSize: 22, color: "var(--ink)" }}>
                  Tu plato
                </p>

                {WHEEL_STEPS.map((step, i) => {
                  const sel = selections[step];
                  const meta = WHEEL_CATEGORY_META[step];
                  if (!sel) return null;
                  return (
                    <div
                      key={step}
                      className="flex items-center justify-between py-2.5"
                      style={{ borderBottom: "1px solid var(--beige)" }}
                    >
                      <div className="flex items-center gap-2.5 flex-1">
                        <div className="w-2.5 h-2.5 shrink-0" style={{ borderRadius: "50%", background: meta.color }} />
                        <div>
                          <p className="text-[13px] font-semibold m-0" style={{ color: "var(--ink)" }}>{sel.name}</p>
                          <p className="text-[11px] m-0" style={{ color: "var(--ink-muted)" }}>{sel.portion}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--ink-muted)" }}>{sel.kcal} kcal</span>
                        <span onClick={() => respin(i)} className="cursor-pointer text-base opacity-50 px-1" style={{ color: "var(--ink-muted)" }}>↻</span>
                      </div>
                    </div>
                  );
                })}

                {/* Totals */}
                <div className="pt-3.5">
                  <div className="flex justify-between items-baseline mb-2.5">
                    <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Total</span>
                    <span className="text-base font-bold" style={{ color: "var(--ink)" }}>{totals.kcal} kcal</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: "Proteína", value: `${totals.protein.toFixed(1)}g`, color: "var(--green)" },
                      { label: "Carbs",    value: `${totals.carbs.toFixed(1)}g`,   color: "var(--blue)" },
                      { label: "Grasa",    value: `${totals.fat.toFixed(1)}g`,     color: "var(--orange)" },
                      { label: "Fibra",    value: `${totals.fiber.toFixed(1)}g`,   color: "var(--lavender)" },
                    ].map((m, mi) => (
                      <div key={mi} className="py-2 px-1 text-center" style={{ background: "var(--beige)" }}>
                        <div className="text-sm font-bold" style={{ color: m.color }}>{m.value}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: "var(--ink-muted)" }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {totals.kcal > 550 && (
                  <div
                    className="mt-3 px-3 py-2 text-xs"
                    style={{ background: "var(--peach)", borderLeft: "3px solid var(--orange)", color: "var(--ink)" }}
                  >
                    ⚠️ Por encima de ~500 kcal. Considera porción más pequeña del carb o proteína.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom buttons — sticky */}
      <div
        className="sticky bottom-0 bg-[var(--beige)] px-4 pt-2.5 pb-5 flex justify-center gap-2.5 mt-2"
        style={{ borderTop: "1px solid var(--border-color)" }}
      >
        {!showSummary ? (
          <>
            {currentStep > 0 && (
              <Button variant="outline" onClick={prevStep}>
                ← Atrás
              </Button>
            )}
            {currentMeta.skippable && (
              <Button variant="outline" onClick={skipStep} className="border-dashed">
                Sin carb
              </Button>
            )}
            {hasSelection && (
              <Button onClick={nextStep}>
                {currentStep < WHEEL_STEPS.length - 1 ? "Siguiente →" : "Ver mi plato"}
              </Button>
            )}
          </>
        ) : (
          <Button onClick={reset} size="lg">
            Nuevo plato
          </Button>
        )}
      </div>
    </div>
  );
}
