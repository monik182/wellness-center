import { useEffect, useRef } from "react";
import type { LoggedMeal, PendingEntry } from "../types";
import { formatTime } from "../utils";
import FeedEntry from "./FeedEntry";

interface JournalFeedProps {
  meals: LoggedMeal[];
  loading: boolean;
  pendingEntries: PendingEntry[];
  onEntryTap: (mealId: string, itemIndex: number) => void;
  onPendingRetry: (id: string) => void;
  onPendingDismiss: (id: string) => void;
}

export default function JournalFeed({
  meals,
  loading,
  pendingEntries,
  onEntryTap,
  onPendingRetry,
}: JournalFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pendingEntries.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [pendingEntries.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[15px] text-[var(--ink-muted)]">
        Loading...
      </div>
    );
  }

  if (meals.length === 0 && pendingEntries.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-[15px] text-[var(--ink-muted)]">
        Start logging your meals...
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {meals.map((meal) => (
        <div key={meal.id}>
          <div className="px-4 pt-4 pb-1 text-[12px] font-medium text-[var(--ink-muted)] uppercase tracking-wide">
            {formatTime(meal.time)}
          </div>
          {meal.items.map((item, i) => (
            <FeedEntry
              key={`${meal.id}-${i}`}
              item={item}
              onTap={() => onEntryTap(meal.id, i)}
            />
          ))}
        </div>
      ))}

      {pendingEntries.map((entry) => (
        <FeedEntry
          key={entry.id}
          pending={entry}
          onTap={entry.status === "error" ? () => onPendingRetry(entry.id) : undefined}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
