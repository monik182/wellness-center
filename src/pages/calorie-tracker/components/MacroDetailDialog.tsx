import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MacroTotals } from "../types";
import { formatNumber } from "../utils";

interface MacroDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consumed: MacroTotals;
  targets: MacroTotals;
}

const RING_SIZE = 64;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function progressColor(ratio: number): string {
  if (ratio > 1) return "#EF4444";
  if (ratio >= 0.9) return "#F59E0B";
  return "#22C55E";
}

function MacroRing({
  label,
  consumed,
  target,
  unit,
  color,
}: {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: string;
}) {
  const ratio = target > 0 ? consumed / target : 0;
  const clamped = Math.min(ratio, 1);
  const offset = RING_CIRCUMFERENCE * (1 - clamped);
  const ringColor = target > 0 ? progressColor(ratio) : color;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="var(--beige)"
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth={RING_STROKE}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[14px] font-semibold text-[var(--ink)] tabular-nums">
        {Math.round(consumed)}{unit}
      </span>
      <span className="text-[11px] text-[var(--ink-muted)]">{label}</span>
    </div>
  );
}

export default function MacroDetailDialog({
  open,
  onOpenChange,
  consumed,
  targets,
}: MacroDetailDialogProps) {
  const kcalRatio = targets.kcal > 0 ? consumed.kcal / targets.kcal : 0;
  const kcalPercent = Math.min(Math.round(kcalRatio * 100), 100);
  const barColor = progressColor(kcalRatio);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px]">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-semibold">Goals</DialogTitle>
        </DialogHeader>

        {/* Calorie progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[15px]">
            <span className="flex items-center gap-1.5 text-[var(--ink)]">
              <span className="text-orange-400">&#128293;</span> Calories
            </span>
            <span className="tabular-nums text-[var(--ink-muted)]">
              {formatNumber(consumed.kcal)} / {formatNumber(targets.kcal)}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--beige)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${kcalPercent}%`,
                backgroundColor: barColor,
              }}
            />
          </div>
        </div>

        {/* Primary macros */}
        <div className="flex justify-around pt-2">
          <MacroRing label="Carbs" consumed={consumed.carbs} target={targets.carbs} unit="g" color="var(--macro-carbs)" />
          <MacroRing label="Protein" consumed={consumed.protein} target={targets.protein} unit="g" color="var(--macro-protein)" />
          <MacroRing label="Fat" consumed={consumed.fat} target={targets.fat} unit="g" color="var(--macro-fat)" />
        </div>

        {/* Secondary macros */}
        <div className="flex justify-around pt-1">
          <MacroRing label="Sugar" consumed={consumed.sugar} target={targets.sugar} unit="g" color="var(--macro-sugar)" />
          <MacroRing label="Fiber" consumed={consumed.fiber} target={targets.fiber} unit="g" color="var(--macro-fiber)" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
