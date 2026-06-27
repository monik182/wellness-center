import { AlertCircle } from "lucide-react";
import type { LoggedFoodItem, PendingEntry } from "../types";

interface FeedEntryProps {
  item?: LoggedFoodItem;
  pending?: PendingEntry;
  onTap?: () => void;
}

export default function FeedEntry({ item, pending, onTap }: FeedEntryProps) {
  if (pending) {
    const isError = pending.status === "error";
    return (
      <div
        className={`flex items-center justify-between min-h-[44px] px-4 py-3 border-b border-[var(--border-color)] ${
          isError ? "cursor-pointer active:bg-red-50" : ""
        }`}
        onClick={isError ? onTap : undefined}
      >
        <span className="text-[17px] font-medium text-[var(--ink)] leading-snug pr-4 capitalize">
          {pending.text}
        </span>
        {isError ? (
          <span className="flex items-center gap-1 text-[13px] text-red-500 whitespace-nowrap">
            <AlertCircle size={14} />
            Tap to retry
          </span>
        ) : (
          <span className="text-[15px] text-[var(--ink-muted)] whitespace-nowrap tabular-nums animate-pulse">
            Thinking...
          </span>
        )}
      </div>
    );
  }

  if (!item) return null;

  return (
    <div
      className="flex items-center justify-between min-h-[44px] px-4 py-3 border-b border-[var(--border-color)] cursor-pointer active:bg-[var(--beige)] transition-colors"
      onClick={onTap}
    >
      <span className="text-[17px] font-medium text-[var(--ink)] leading-snug pr-4 capitalize">
        {item.name}
      </span>
      <span className="text-[15px] text-[var(--ink-muted)] whitespace-nowrap tabular-nums">
        {Math.round(item.kcal)} cal
      </span>
    </div>
  );
}
