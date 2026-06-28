import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { addDays, formatHeaderDate } from "../utils";

interface SwipeableFeedProps {
  selectedDate: string;
  today: string;
  onNavigate: (date: string) => void;
  children: ReactNode;
}

const THRESHOLD = 50;
const EDGE_GUARD = 24;
const DURATION = 250;

export default function SwipeableFeed({
  selectedDate,
  today,
  onNavigate,
  children,
}: SwipeableFeedProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  const start = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<"h" | "v" | null>(null);
  const animating = useRef(false);

  // Swipe left (dx<0) -> next day; only allowed if not already on today.
  const canNext = addDays(selectedDate, 1) <= today;

  function allowed(dx: number): boolean {
    return dx < 0 ? canNext : true;
  }

  function onTouchStart(e: React.TouchEvent) {
    if (animating.current) return;
    const t = e.touches[0];
    // Leave the screen edges to the browser's back/forward swipe.
    if (t.clientX < EDGE_GUARD || t.clientX > window.innerWidth - EDGE_GUARD) {
      start.current = null;
      return;
    }
    start.current = { x: t.clientX, y: t.clientY };
    axis.current = null;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!start.current || animating.current) return;
    const t = e.touches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;

    if (axis.current === null) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) axis.current = "h";
      else if (Math.abs(dy) > 10) axis.current = "v";
      else return;
    }
    if (axis.current !== "h") return;

    setDragging(true);
    const resisted = allowed(dx) ? dx : dx * 0.3;
    setDragX(resisted);

    const dir = dx < 0 ? 1 : -1;
    setLabel(allowed(dx) ? formatHeaderDate(addDays(selectedDate, dir), today) : null);
  }

  function onTouchEnd() {
    if (!start.current || animating.current) {
      start.current = null;
      return;
    }
    const committed = axis.current === "h" && Math.abs(dragX) >= THRESHOLD && allowed(dragX);
    start.current = null;
    axis.current = null;

    if (!committed) {
      setDragging(false);
      setDragX(0);
      setLabel(null);
      return;
    }

    const dir = dragX < 0 ? 1 : -1;
    animating.current = true;
    setDragging(false);
    setLabel(null);
    setDragX(dir < 0 ? -window.innerWidth : window.innerWidth);

    window.setTimeout(() => {
      onNavigate(addDays(selectedDate, dir));
      // Snap incoming day to the opposite edge without animating, then slide in.
      setDragging(true);
      setDragX(dir < 0 ? window.innerWidth : -window.innerWidth);
      requestAnimationFrame(() => {
        setDragging(false);
        setDragX(0);
        animating.current = false;
      });
    }, DURATION);
  }

  return (
    <div className="relative overflow-hidden">
      {label && (
        <div
          className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-[var(--peach)] px-4 py-1.5 text-[15px] font-semibold text-[var(--ink)] shadow-sm"
          style={{ opacity: Math.min(Math.abs(dragX) / THRESHOLD, 1) }}
        >
          {label}
        </div>
      )}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : `transform ${DURATION}ms ease-out`,
          touchAction: "pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
}
