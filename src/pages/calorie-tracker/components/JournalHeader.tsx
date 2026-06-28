import { Settings } from "lucide-react";
import type { ExerciseLevel } from "../types";
import ExerciseLevelButton from "./ExerciseLevelButton";

interface JournalHeaderProps {
  exerciseLevel: ExerciseLevel;
  onExerciseLevelClick: () => void;
  dateLabel: string;
  onDateClick: () => void;
}

export default function JournalHeader({
  exerciseLevel,
  onExerciseLevelClick,
  dateLabel,
  onDateClick,
}: JournalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      {/* Left: compact title */}
      <span
        className="text-[18px] font-normal text-[var(--ink)]"
        style={{ fontFamily: "'La Belle Aurore', cursive" }}
      >
        Journal
      </span>

      {/* Center: date label */}
      <button
        onClick={onDateClick}
        className="flex items-center justify-center min-h-[44px] px-3 rounded-full text-[17px] font-semibold text-[var(--ink)] active:bg-[var(--beige)] transition-colors"
        aria-label="Change date"
      >
        {dateLabel}
      </button>

      {/* Right: exercise level + settings */}
      <div className="flex items-center gap-1">
        <ExerciseLevelButton level={exerciseLevel} onClick={onExerciseLevelClick} />
        <button
          className="flex items-center justify-center w-[44px] h-[44px] rounded-full text-[var(--ink-muted)] active:bg-[var(--beige)] transition-colors"
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
}
