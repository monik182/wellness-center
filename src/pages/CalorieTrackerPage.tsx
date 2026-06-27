import { useState, useCallback } from "react";
import { api } from "../api/client";
import { useMeals } from "./calorie-tracker/hooks/useMeals";
import { useExerciseLevel } from "./calorie-tracker/hooks/useExerciseLevel";
import { sumMealTotals, sumTotals } from "./calorie-tracker/types";
import type { LoggedFoodItem, LoggedMeal, PendingEntry } from "./calorie-tracker/types";
import { getToday, getCurrentTime } from "./calorie-tracker/utils";
import JournalHeader from "./calorie-tracker/components/JournalHeader";
import JournalFeed from "./calorie-tracker/components/JournalFeed";
import InputBar from "./calorie-tracker/components/InputBar";
import MacroBar from "./calorie-tracker/components/MacroBar";
import MacroDetailDialog from "./calorie-tracker/components/MacroDetailDialog";
import ExerciseLevelDialog from "./calorie-tracker/components/ExerciseLevelDialog";
import NutritionDetailSheet from "./calorie-tracker/components/NutritionDetailSheet";

export default function CalorieTrackerPage() {
  const today = getToday();
  const { meals, loading, refetch } = useMeals(today);
  const { level, setLevel, targets } = useExerciseLevel(today);

  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);
  const [detailItem, setDetailItem] = useState<{ item: LoggedFoodItem; mealId: string } | null>(null);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [macroDialogOpen, setMacroDialogOpen] = useState(false);

  // Include resolved pending items in consumed totals for optimistic updates
  const persistedConsumed = sumMealTotals(meals);
  const pendingResolved = pendingEntries.filter((e) => e.resolved).map((e) => e.resolved!);
  const consumed = pendingResolved.length > 0
    ? sumTotals([...meals.flatMap((m) => m.items), ...pendingResolved])
    : persistedConsumed;

  function updatePending(id: string, patch: Partial<PendingEntry>) {
    setPendingEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function removePending(id: string) {
    setPendingEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const resolveAndPersist = useCallback(async (entry: PendingEntry) => {
    try {
      const resolved = await api.resolveNutrition(entry.text, 100);
      const weight = resolved.default_weight_g ?? 100;
      const scale = weight / 100;
      const item: LoggedFoodItem = {
        foodId: `resolved-${entry.text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: resolved.name,
        weight_g: weight,
        source: resolved.source,
        kcal: resolved.per_100g.kcal * scale,
        protein: resolved.per_100g.protein * scale,
        carbs: resolved.per_100g.carbs * scale,
        fat: resolved.per_100g.fat * scale,
        fiber: resolved.per_100g.fiber * scale,
        sugar: resolved.per_100g.sugar * scale,
      };

      updatePending(entry.id, { status: "saving", resolved: item });

      const meal: LoggedMeal = {
        id: crypto.randomUUID(),
        date: today,
        time: entry.time,
        items: [item],
        totals: sumTotals([item]),
      };
      await api.addMeal(meal);
      removePending(entry.id);
      refetch();
    } catch (e) {
      updatePending(entry.id, {
        status: "error",
        error: e instanceof Error ? e.message : "Failed to resolve",
      });
    }
  }, [today, refetch]);

  function handleSubmit(text: string) {
    const entry: PendingEntry = {
      id: crypto.randomUUID(),
      text,
      time: getCurrentTime(),
      status: "resolving",
    };
    setPendingEntries((prev) => [...prev, entry]);
    resolveAndPersist(entry);
  }

  function handleRetry(id: string) {
    const entry = pendingEntries.find((e) => e.id === id);
    if (!entry) return;
    updatePending(id, { status: "resolving", error: undefined, resolved: undefined });
    resolveAndPersist({ ...entry, status: "resolving", error: undefined, resolved: undefined });
  }

  function handleDismiss(id: string) {
    removePending(id);
  }

  async function handleDelete(mealId: string) {
    setDetailItem(null);
    await api.deleteMeal(mealId);
    refetch();
  }

  function handleEntryTap(mealId: string, itemIndex: number) {
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) return;
    const item = meal.items[itemIndex];
    if (!item) return;
    setDetailItem({ item, mealId });
  }

  return (
    <div className="pb-[140px]">
      <JournalHeader
        exerciseLevel={level}
        onExerciseLevelClick={() => setExerciseDialogOpen(true)}
      />
      <JournalFeed
        meals={meals}
        loading={loading}
        pendingEntries={pendingEntries}
        onEntryTap={handleEntryTap}
        onPendingRetry={handleRetry}
        onPendingDismiss={handleDismiss}
      />
      <InputBar onSubmit={handleSubmit} />
      <MacroBar consumed={consumed} onTap={() => setMacroDialogOpen(true)} />

      <ExerciseLevelDialog
        open={exerciseDialogOpen}
        onOpenChange={setExerciseDialogOpen}
        level={level}
        onSelect={(l) => {
          setLevel(l);
          setExerciseDialogOpen(false);
        }}
      />
      <MacroDetailDialog
        open={macroDialogOpen}
        onOpenChange={setMacroDialogOpen}
        consumed={consumed}
        targets={targets}
      />
      <NutritionDetailSheet
        open={!!detailItem}
        onOpenChange={(o) => { if (!o) setDetailItem(null); }}
        item={detailItem?.item ?? null}
        mealId={detailItem?.mealId ?? null}
        onDelete={handleDelete}
      />
    </div>
  );
}
