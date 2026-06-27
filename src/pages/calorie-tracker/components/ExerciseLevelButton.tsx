import { Moon, Footprints, Bike, Dumbbell } from "lucide-react";
import type { ExerciseLevel } from "../types";

const ICONS: Record<ExerciseLevel, typeof Moon> = {
  none: Moon,
  easy: Footprints,
  medium: Bike,
  hard: Dumbbell,
};

const COLORS: Record<ExerciseLevel, string> = {
  none: "var(--beige)",
  easy: "var(--green)",
  medium: "var(--blue)",
  hard: "var(--orange)",
};

interface ExerciseLevelButtonProps {
  level: ExerciseLevel;
  onClick: () => void;
}

export default function ExerciseLevelButton({ level, onClick }: ExerciseLevelButtonProps) {
  const Icon = ICONS[level];

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-[44px] h-[44px] rounded-full active:scale-95 transition-transform"
      style={{ backgroundColor: COLORS[level] }}
      aria-label={`Exercise level: ${level}`}
    >
      <Icon size={20} className="text-[var(--ink)]" />
    </button>
  );
}
