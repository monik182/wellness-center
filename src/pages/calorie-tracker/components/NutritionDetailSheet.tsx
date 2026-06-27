import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LoggedFoodItem } from "../types";

interface NutritionDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LoggedFoodItem | null;
  mealId: string | null;
  onDelete: (mealId: string) => void;
}

const MACRO_ROWS: { key: keyof LoggedFoodItem; label: string; unit: string }[] = [
  { key: "kcal", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "sugar", label: "Sugar", unit: "g" },
];

const SOURCE_LABELS: Record<string, string> = {
  hardcoded: "Database",
  off: "Open Food Facts",
  off_barcode: "Barcode",
  haiku: "AI estimate",
  label_scan: "Label scan",
  custom: "Custom",
};

export default function NutritionDetailSheet({
  open,
  onOpenChange,
  item,
  mealId,
  onDelete,
}: NutritionDetailSheetProps) {
  if (!item || !mealId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px]">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-semibold capitalize">
            {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-muted)]">
          <span>{Math.round(item.weight_g)}g</span>
          {item.source && (
            <>
              <span>·</span>
              <span>{SOURCE_LABELS[item.source] ?? item.source}</span>
            </>
          )}
        </div>

        <div className="flex flex-col gap-0.5 pt-1">
          {MACRO_ROWS.map(({ key, label, unit }) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-b-0"
            >
              <span className="text-[15px] text-[var(--ink)]">{label}</span>
              <span className="text-[15px] tabular-nums text-[var(--ink-muted)]">
                {Math.round(item[key] as number)} {unit}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => onDelete(mealId)}
          className="mt-2 w-full h-[44px] rounded-lg text-[15px] font-medium text-red-500 bg-red-50 active:bg-red-100 transition-colors"
        >
          Delete entry
        </button>
      </DialogContent>
    </Dialog>
  );
}
