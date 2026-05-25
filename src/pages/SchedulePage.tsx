import { SCHEDULES } from "../data/meals";

export default function SchedulePage() {
  return (
    <div>
      {SCHEDULES.map((day, di) => (
        <div key={di} style={{
          background: "var(--cream)", borderRadius: 16,
          padding: 16, marginBottom: 12,
          border: "1px solid var(--border)",
        }}>
          <p style={{ fontWeight: 600, fontSize: 15, margin: "0 0 12px", color: "var(--ink)" }}>
            {day.title}
          </p>
          {day.schedule.map((row, ri) => (
            <div key={ri} style={{
              display: "flex", gap: 12, marginBottom: 10,
              paddingBottom: ri < day.schedule.length - 1 ? 10 : 0,
              borderBottom: ri < day.schedule.length - 1 ? "1px solid var(--beige)" : "none",
            }}>
              <div style={{ minWidth: 70, fontSize: 11, fontWeight: 600, color: "var(--muted)", paddingTop: 2 }}>
                {row.time}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: "0 0 2px" }}>
                  {row.meal}
                </p>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                  {row.detail}
                </p>
              </div>
            </div>
          ))}
          {day.notes && (
            <div style={{
              marginTop: 8, padding: "10px 12px",
              background: "var(--peach)", borderRadius: 8,
              fontSize: 12, color: "var(--ink)", lineHeight: 1.6,
              borderLeft: "3px solid var(--blue)",
            }}>
              💡 {day.notes}
            </div>
          )}
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", margin: "10px 0 0", textAlign: "right" }}>
            {day.total}
          </p>
        </div>
      ))}
    </div>
  );
}
