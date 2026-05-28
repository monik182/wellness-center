import { SCHEDULES } from "../data/meals";
import { Card, CardContent } from "@/components/ui/card";

export default function SchedulePage() {
  return (
    <div className="flex flex-col gap-3">
      {SCHEDULES.map((day, di) => (
        <Card key={di}>
          <CardContent className="pt-4">
            <p className="font-semibold text-[15px] mb-3" style={{ color: "var(--ink)" }}>
              {day.title}
            </p>
            {day.schedule.map((row, ri) => (
              <div
                key={ri}
                className="flex gap-3 mb-2.5 pb-2.5"
                style={{
                  borderBottom: ri < day.schedule.length - 1 ? "1px solid var(--beige)" : "none",
                }}
              >
                <div className="min-w-[70px] text-[11px] font-semibold pt-0.5" style={{ color: "var(--ink-muted)" }}>
                  {row.time}
                </div>
                <div>
                  <p className="text-[13px] font-semibold mb-0.5" style={{ color: "var(--ink)" }}>
                    {row.meal}
                  </p>
                  <p className="text-xs leading-relaxed m-0" style={{ color: "var(--ink-muted)" }}>
                    {row.detail}
                  </p>
                </div>
              </div>
            ))}
            {day.notes && (
              <div
                className="mt-2 px-3 py-2.5 text-xs leading-relaxed"
                style={{ background: "var(--peach)", borderLeft: "3px solid var(--blue)", color: "var(--ink)" }}
              >
                💡 {day.notes}
              </div>
            )}
            <p className="text-xs font-semibold mt-2.5 text-right" style={{ color: "var(--green)" }}>
              {day.total}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
