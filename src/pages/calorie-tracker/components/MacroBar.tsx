import { Flame } from "lucide-react";
import type { MacroTotals } from "../types";
import { formatNumber } from "../utils";

interface MacroBarProps {
  consumed: MacroTotals;
  onTap: () => void;
}

export default function MacroBar({ consumed, onTap }: MacroBarProps) {
  return (
    <button
      onClick={onTap}
      className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center gap-3 h-[48px] bg-[var(--cream)] border-t border-[var(--border-color)] active:bg-[var(--beige)] transition-colors"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="View macro details"
    >
      <span className="flex items-center gap-1 text-[13px] font-semibold text-[var(--ink)]">
        <Flame size={14} className="text-orange-400" />
        {formatNumber(consumed.kcal)}
      </span>
      <span className="text-[11px] text-[var(--ink-muted)]">·</span>
      <span className="text-[13px] text-[var(--ink-muted)]">
        C {Math.round(consumed.carbs)}
      </span>
      <span className="text-[11px] text-[var(--ink-muted)]">·</span>
      <span className="text-[13px] text-[var(--ink-muted)]">
        P {Math.round(consumed.protein)}
      </span>
      <span className="text-[11px] text-[var(--ink-muted)]">·</span>
      <span className="text-[13px] text-[var(--ink-muted)]">
        F {Math.round(consumed.fat)}
      </span>
    </button>
  );
}
