import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExerciseLevel } from "../types";
import { EXERCISE_LEVELS, JOURNAL_TARGETS } from "../types";
import { formatNumber } from "../utils";

interface ExerciseLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: ExerciseLevel;
  onSelect: (level: ExerciseLevel) => void;
}

export default function ExerciseLevelDialog({
  open,
  onOpenChange,
  level,
  onSelect,
}: ExerciseLevelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px]">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-semibold">
            Today's activity level
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1">
          {EXERCISE_LEVELS.map((opt) => {
            const selected = opt.level === level;
            const target = JOURNAL_TARGETS[opt.level];

            return (
              <button
                key={opt.level}
                onClick={() => onSelect(opt.level)}
                className={`flex items-center justify-between min-h-[48px] px-4 py-3 rounded-lg text-left transition-colors ${
                  selected
                    ? "bg-[var(--ink)] text-[var(--cream)]"
                    : "bg-[var(--beige)] text-[var(--ink)] active:bg-[var(--border-color)]"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[15px] font-medium">{opt.label}</span>
                  <span className={`text-[12px] ${selected ? "text-[var(--cream)]/70" : "text-[var(--ink-muted)]"}`}>
                    {opt.desc}
                  </span>
                </div>
                <span className={`text-[13px] tabular-nums whitespace-nowrap ml-3 ${selected ? "text-[var(--cream)]/80" : "text-[var(--ink-muted)]"}`}>
                  {formatNumber(target.kcal)} kcal
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-[12px] text-[var(--ink-muted)] pt-1">
          Adjusts your calorie and protein targets for today.
        </p>
      </DialogContent>
    </Dialog>
  );
}
