import { useState, useEffect } from "react";
import type { ExerciseLevel, MacroTotals } from "../types";
import { JOURNAL_TARGETS } from "../types";

const STORAGE_KEY = "journal_exercise_level";

interface Stored {
  level: ExerciseLevel;
  date: string;
}

export function useExerciseLevel(date: string) {
  const [level, setLevelState] = useState<ExerciseLevel>("none");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: Stored = JSON.parse(raw);
        if (stored.date === date) {
          setLevelState(stored.level);
          return;
        }
      }
    } catch { /* ignore corrupt data */ }
    setLevelState("none");
  }, [date]);

  function setLevel(next: ExerciseLevel) {
    setLevelState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ level: next, date }));
  }

  const targets: MacroTotals = JOURNAL_TARGETS[level];

  return { level, setLevel, targets };
}
