import { PREP_GUIDE } from "../data/meals";

export default function PrepPage() {
  return (
    <div>
      <div style={{
        background: "var(--cream)", borderRadius: 16,
        padding: 14, marginBottom: 14, border: "1px solid var(--border)",
      }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: "0 0 4px" }}>
          🕐 Tiempo total: ~1.5 horas
        </p>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
          Domingo (o cuando puedas). Te dura 4-5 días.
        </p>
      </div>

      {PREP_GUIDE.map((step, i) => (
        <div key={i} style={{
          background: "var(--cream)", borderRadius: 16,
          padding: 14, marginBottom: 8,
          border: "1px solid var(--border)",
          display: "flex", gap: 12,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "var(--blue)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 14, color: "var(--ink)", flexShrink: 0,
          }}>
            {step.step}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 3px", color: "var(--ink)" }}>
                {step.title}
              </p>
              <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>{step.time}</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              {step.detail}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
