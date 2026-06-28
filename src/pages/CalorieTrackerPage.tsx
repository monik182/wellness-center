import { useState, useCallback, useEffect } from "react";
import { api } from "../api/client";
import { useMeals, prefetchMeals } from "./calorie-tracker/hooks/useMeals";
import { useExerciseLevel } from "./calorie-tracker/hooks/useExerciseLevel";
import { usePhotoCapture } from "./calorie-tracker/hooks/usePhotoCapture";
import { sumMealTotals, sumTotals } from "./calorie-tracker/types";
import type { LoggedFoodItem, LoggedMeal, PendingEntry } from "./calorie-tracker/types";
import { getToday, getCurrentTime, itemFromResolve, formatHeaderDate, addDays } from "./calorie-tracker/utils";
import JournalHeader from "./calorie-tracker/components/JournalHeader";
import CalendarPicker from "./calorie-tracker/components/CalendarPicker";
import JournalFeed from "./calorie-tracker/components/JournalFeed";
import SwipeableFeed from "./calorie-tracker/components/SwipeableFeed";
import InputBar from "./calorie-tracker/components/InputBar";
import MacroBar from "./calorie-tracker/components/MacroBar";
import MacroDetailDialog from "./calorie-tracker/components/MacroDetailDialog";
import ExerciseLevelDialog from "./calorie-tracker/components/ExerciseLevelDialog";
import NutritionDetailSheet from "./calorie-tracker/components/NutritionDetailSheet";
import PhotoConfirmSheet from "./calorie-tracker/components/PhotoConfirmSheet";

export default function CalorieTrackerPage() {
  const today = getToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const { meals, loading, refetch } = useMeals(selectedDate);
  const { level, setLevel, targets } = useExerciseLevel(selectedDate);
  const photo = usePhotoCapture();

  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);
  const [detailItem, setDetailItem] = useState<{ item: LoggedFoodItem; mealId: string } | null>(null);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [macroDialogOpen, setMacroDialogOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Prefetch adjacent days so swipe navigation feels instant.
  useEffect(() => {
    prefetchMeals(addDays(selectedDate, -1));
    const next = addDays(selectedDate, 1);
    if (next <= today) prefetchMeals(next);
  }, [selectedDate, today]);

  function navigateDay(date: string) {
    if (date > today) return;
    setSelectedDate(date);
  }

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
      const item = itemFromResolve(resolved, resolved.default_weight_g ?? 100);

      updatePending(entry.id, { status: "saving", resolved: item });

      const meal: LoggedMeal = {
        id: crypto.randomUUID(),
        date: selectedDate,
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
  }, [selectedDate, refetch]);

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

  function handlePhoto(file: File) {
    setPhotoOpen(true);
    photo.onFileSelected(file);
  }

  function handlePhotoOpenChange(open: boolean) {
    setPhotoOpen(open);
    if (!open) photo.reset();
  }

  async function handlePhotoAccept(items: LoggedFoodItem[]) {
    const meal: LoggedMeal = {
      id: crypto.randomUUID(),
      date: selectedDate,
      time: getCurrentTime(),
      items,
      totals: sumTotals(items),
    };
    await api.addMeal(meal);
    setPhotoOpen(false);
    photo.reset();
    refetch();
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
        dateLabel={formatHeaderDate(selectedDate, today)}
        onDateClick={() => setCalendarOpen(true)}
      />
      <SwipeableFeed selectedDate={selectedDate} today={today} onNavigate={navigateDay}>
        <JournalFeed
          meals={meals}
          loading={loading}
          pendingEntries={pendingEntries}
          onEntryTap={handleEntryTap}
          onPendingRetry={handleRetry}
          onPendingDismiss={handleDismiss}
        />
      </SwipeableFeed>
      <InputBar onSubmit={handleSubmit} onVoiceResult={handleSubmit} onPhoto={handlePhoto} />
      <MacroBar consumed={consumed} onTap={() => setMacroDialogOpen(true)} />

      <CalendarPicker
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        selectedDate={selectedDate}
        today={today}
        onSelect={(d) => {
          setSelectedDate(d);
          setCalendarOpen(false);
        }}
      />
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
      <PhotoConfirmSheet
        open={photoOpen}
        onOpenChange={handlePhotoOpenChange}
        status={photo.status}
        imageDataUrl={photo.imageDataUrl}
        detectedItems={photo.detectedItems}
        summary={photo.summary}
        warnings={photo.warnings}
        error={photo.error}
        onAccept={handlePhotoAccept}
      />
    </div>
  );
}
