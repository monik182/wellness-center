import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "../../../api/client";
import type { DetectedItem } from "../../../api/client";
import type { LoggedFoodItem } from "../types";
import { sumTotals } from "../types";
import { itemFromResolve, formatNumber } from "../utils";

interface PhotoConfirmSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: "idle" | "detecting" | "detected" | "error";
  imageDataUrl: string | null;
  detectedItems: DetectedItem[];
  summary: string;
  warnings: string[];
  error: string | null;
  onAccept: (items: LoggedFoodItem[]) => Promise<void> | void;
}

interface EditableItem {
  name: string;
  weight_g: number;
}

const MACRO_ROWS: { key: keyof LoggedFoodItem; label: string; unit: string }[] = [
  { key: "kcal", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "sugar", label: "Sugar", unit: "g" },
];

export default function PhotoConfirmSheet({
  open,
  onOpenChange,
  status,
  imageDataUrl,
  detectedItems,
  summary,
  warnings,
  error,
  onAccept,
}: PhotoConfirmSheetProps) {
  const [step, setStep] = useState<"edit" | "confirm">("edit");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [resolved, setResolved] = useState<LoggedFoodItem[]>([]);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Re-seed editable items from a fresh detection (adjust state during render)
  const [seededFrom, setSeededFrom] = useState<DetectedItem[] | null>(null);
  if (seededFrom !== detectedItems) {
    setSeededFrom(detectedItems);
    setItems(detectedItems.map((d) => ({ name: d.name, weight_g: d.weight_g })));
    setStep("edit");
    setResolved([]);
    setResolveError(null);
  }

  const isFood = status === "detected" && items.length > 0;

  function updateItem(index: number, patch: Partial<EditableItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  async function handleCalculate() {
    setResolving(true);
    setResolveError(null);
    try {
      const out = await Promise.all(
        items.map(async (it) => {
          const r = await api.resolveNutrition(it.name, it.weight_g);
          return itemFromResolve(r, it.weight_g);
        })
      );
      setResolved(out);
      setStep("confirm");
    } catch {
      setResolveError("Failed to calculate calories.");
    } finally {
      setResolving(false);
    }
  }

  async function handleAccept() {
    setSaving(true);
    try {
      await onAccept(resolved);
    } finally {
      setSaving(false);
    }
  }

  const totals = sumTotals(resolved);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-semibold">
            {step === "confirm" ? "Review entry" : "Photo log"}
          </DialogTitle>
        </DialogHeader>

        {imageDataUrl && (
          <img
            src={imageDataUrl}
            alt="Selected food"
            className="w-full max-h-[200px] object-cover rounded-[13px]"
          />
        )}

        {status === "detecting" && (
          <p className="py-4 text-center text-[15px] text-[var(--ink-muted)] animate-pulse">
            Analyzing photo...
          </p>
        )}

        {status === "error" && (
          <p className="py-4 text-center text-[15px] text-red-500">
            {error ?? "Could not analyze the image."}
          </p>
        )}

        {status === "detected" && !isFood && (
          <p className="py-4 text-center text-[15px] text-[var(--ink-muted)]">
            This doesn't look like food.
            {summary ? ` ${summary}` : ""}
          </p>
        )}

        {/* Edit step */}
        {step === "edit" && isFood && (
          <>
            {summary && (
              <p className="text-[13px] text-[var(--ink-muted)]">{summary}</p>
            )}
            <div className="flex flex-col gap-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={it.name}
                    onChange={(e) => updateItem(i, { name: e.target.value })}
                    className="flex-1 h-[44px] px-3 rounded-lg bg-[var(--beige)] text-[17px] text-[var(--ink)] outline-none border-none"
                    aria-label="Food name"
                  />
                  <input
                    type="number"
                    min={1}
                    value={it.weight_g}
                    onChange={(e) => updateItem(i, { weight_g: Number(e.target.value) })}
                    className="w-[72px] h-[44px] px-2 rounded-lg bg-[var(--beige)] text-[17px] text-[var(--ink)] tabular-nums outline-none border-none text-right"
                    aria-label="Weight in grams"
                  />
                  <span className="text-[13px] text-[var(--ink-muted)]">g</span>
                </div>
              ))}
            </div>
            {warnings.length > 0 && (
              <ul className="text-[12px] text-[var(--ink-muted)] list-disc pl-4">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
            {resolveError && (
              <p className="text-[13px] text-red-500">{resolveError}</p>
            )}
            <button
              onClick={handleCalculate}
              disabled={resolving}
              className="mt-1 w-full h-[50px] rounded-lg text-[17px] font-semibold text-white bg-[var(--ink)] active:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {resolving ? "Calculating..." : "Calculate Calories"}
            </button>
          </>
        )}

        {/* Confirm step */}
        {step === "confirm" && (
          <>
            <div className="flex flex-col gap-0.5">
              {resolved.map((it, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-[var(--border-color)]"
                >
                  <span className="text-[15px] text-[var(--ink)] capitalize">
                    {it.name} <span className="text-[var(--ink-muted)]">{Math.round(it.weight_g)}g</span>
                  </span>
                  <span className="text-[15px] tabular-nums text-[var(--ink-muted)]">
                    {formatNumber(it.kcal)} cal
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0.5 pt-1">
              {MACRO_ROWS.map(({ key, label, unit }) => (
                <div key={key} className="flex items-center justify-between py-1">
                  <span className="text-[13px] text-[var(--ink-muted)]">{label}</span>
                  <span className="text-[13px] tabular-nums text-[var(--ink)]">
                    {Math.round(totals[key as keyof typeof totals])} {unit}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setStep("edit")}
                disabled={saving}
                className="flex-1 h-[44px] rounded-lg text-[15px] font-medium text-[var(--ink)] bg-[var(--beige)] active:opacity-90 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleAccept}
                disabled={saving}
                className="flex-1 h-[44px] rounded-lg text-[15px] font-semibold text-white bg-[var(--ink)] active:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Accept"}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
