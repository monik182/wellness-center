import { KEY_RULES, WHAT_CHANGED, SWEETS_RULES } from "../data/meals";

export default function RulesPage() {
  return (
    <div>
      {/* Key rules */}
      <div style={{ background: "var(--peach)", borderRadius: 16, padding: 16, marginBottom: 12, border: "1px solid var(--border)" }}>
        <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 10px", color: "var(--ink)" }}>
          ⚡ Las 2 reglas clave
        </p>
        {KEY_RULES.map((rule, i) => (
          <p key={i} style={{ fontSize: 13, color: "var(--ink)", margin: "0 0 8px", lineHeight: 1.6, fontWeight: 500 }}>
            {i + 1}. {rule}
          </p>
        ))}
      </div>

      {/* What changed */}
      <div style={{ background: "var(--cream)", borderRadius: 16, padding: 16, marginBottom: 12, border: "1px solid var(--border)" }}>
        <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 10px", color: "var(--ink)" }}>
          🔧 Lo que cambió
        </p>
        {WHAT_CHANGED.map(({ what, change, saving }, i) => (
          <div key={i} style={{
            padding: "7px 0",
            borderBottom: i < WHAT_CHANGED.length - 1 ? "1px solid var(--beige)" : "none",
            fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6,
          }}>
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>{what}:</span> {change}
            <br />
            <span style={{ color: "var(--green)", fontWeight: 500 }}>→ {saving}</span>
          </div>
        ))}
      </div>

      {/* Sweets rules */}
      <div style={{ background: "var(--cream)", borderRadius: 16, padding: 16, border: "1px solid var(--border)" }}>
        <p style={{ fontWeight: 600, fontSize: 14, margin: "0 0 10px", color: "var(--ink)" }}>
          🍫 Reglas del dulce
        </p>
        {SWEETS_RULES.map((rule, i) => (
          <p key={i} style={{
            fontSize: 12.5, color: "var(--muted)", margin: "0 0 8px",
            lineHeight: 1.6, paddingLeft: 8,
            borderLeft: "2px solid var(--lavender)",
          }}>
            {rule}
          </p>
        ))}
      </div>
    </div>
  );
}
