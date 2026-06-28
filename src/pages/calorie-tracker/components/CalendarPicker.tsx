import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "../../../api/client";
import type { MacroTotals } from "../types";
import { formatNumber } from "../utils";

interface CalendarPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  today: string;
  onSelect: (date: string) => void;
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export default function CalendarPicker({
  open,
  onOpenChange,
  selectedDate,
  today,
  onSelect,
}: CalendarPickerProps) {
  const [visible, setVisible] = useState(() => {
    const [y, m] = selectedDate.split("-").map(Number);
    return { year: y, month: m };
  });
  const [totalsByDate, setTotalsByDate] = useState<Map<string, MacroTotals>>(new Map());

  // DialogContent unmounts on close, so visible month reinitializes from
  // selectedDate on each open via the useState initializer above.
  useEffect(() => {
    let cancelled = false;
    api.getMealDates(visible.year, visible.month).then((rows) => {
      if (cancelled) return;
      setTotalsByDate(new Map(rows.map((r) => [r.date, r.totals])));
    }).catch(() => {
      if (!cancelled) setTotalsByDate(new Map());
    });
    return () => { cancelled = true; };
  }, [visible.year, visible.month]);

  const daysInMonth = new Date(visible.year, visible.month, 0).getDate();
  const firstOffset = (new Date(visible.year, visible.month - 1, 1).getDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" })
    .format(new Date(visible.year, visible.month - 1, 1));

  const previewTotals = totalsByDate.get(selectedDate);

  function changeMonth(delta: number) {
    setVisible((v) => {
      const next = new Date(v.year, v.month - 1 + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() + 1 };
    });
  }

  const cells: (number | null)[] = [
    ...Array(firstOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px]" showCloseButton={false}>
        {/* Header: Today / month nav / Done */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onSelect(today)}
            className="min-h-[44px] px-2 text-[15px] font-medium text-[var(--ink)] active:opacity-60 transition-opacity"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => changeMonth(-1)}
              className="flex items-center justify-center w-[36px] h-[36px] rounded-full text-[var(--ink-muted)] active:bg-[var(--beige)] transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <DialogTitle className="text-[15px] font-semibold text-[var(--ink)] w-[88px] text-center">
              {monthLabel}
            </DialogTitle>
            <button
              onClick={() => changeMonth(1)}
              className="flex items-center justify-center w-[36px] h-[36px] rounded-full text-[var(--ink-muted)] active:bg-[var(--beige)] transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="min-h-[44px] px-2 text-[15px] font-semibold text-[var(--ink)] active:opacity-60 transition-opacity"
          >
            Done
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="text-center text-[12px] text-[var(--ink-muted)]">
              {d}
            </span>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (day === null) return <span key={i} />;
            const date = dateStr(visible.year, visible.month, day);
            const isFuture = date > today;
            const isSelected = date === selectedDate;
            const hasMeals = totalsByDate.has(date);

            return (
              <button
                key={i}
                disabled={isFuture}
                onClick={() => onSelect(date)}
                className={`relative flex flex-col items-center justify-center min-h-[44px] rounded-full text-[15px] tabular-nums transition-colors ${
                  isSelected
                    ? "bg-[var(--ink)] text-[var(--cream)]"
                    : isFuture
                      ? "text-[var(--ink-muted)] opacity-40"
                      : "text-[var(--ink)] active:bg-[var(--beige)]"
                }`}
              >
                {day}
                {hasMeals && (
                  <span
                    className={`absolute bottom-[6px] w-[4px] h-[4px] rounded-full ${
                      isSelected ? "bg-[var(--cream)]" : "bg-[var(--ink-muted)]"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Preview for the selected date */}
        <div className="flex items-center justify-center gap-3 pt-1 text-[13px] text-[var(--ink-muted)] tabular-nums">
          {previewTotals ? (
            <>
              <span>🔥 {formatNumber(previewTotals.kcal)}</span>
              <span>P {formatNumber(previewTotals.protein)}g</span>
              <span>C {formatNumber(previewTotals.carbs)}g</span>
              <span>F {formatNumber(previewTotals.fat)}g</span>
            </>
          ) : (
            <span>No meals logged</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
