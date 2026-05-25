import { useState } from "react";
import { MEALS, type MealOption } from "../data/meals";

function MealCard({ option, color }: { option: MealOption; color: string }) {
  return (
    <div style={{
      background: "var(--peach)",
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{option.name}</span>
        <span style={{
          fontSize: 12, color: "var(--muted)",
          background: "var(--green)", padding: "2px 8px",
          borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap",
        }}>
          {option.kcal} kcal · {option.protein} prot
        </span>
      </div>
      <ul style={{ paddingLeft: 16, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.7, margin: "6px 0" }}>
        {option.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
      </ul>
      {option.notes && (
        <div style={{
          marginTop: 8, padding: "8px 10px",
          background: "var(--cream)", borderRadius: 8,
          fontSize: 12, color: "var(--ink)", lineHeight: 1.6,
          borderLeft: `3px solid ${color}`,
        }}>
          💡 {option.notes}
        </div>
      )}
      {option.prep && (
        <p style={{ fontSize: 11, color: "var(--muted)", margin: "6px 0 0" }}>⏱ {option.prep}</p>
      )}
    </div>
  );
}

const ACCENT_COLORS: Record<string, string> = {
  desayuno: "#FFD1A1",
  almuerzo: "#B2D8B2",
  postre:   "#F5C6D0",
  snack:    "#E0BBE4",
  preworkout: "#BDE0FE",
};

export default function MealsPage() {
  const [open, setOpen] = useState<Record<string, boolean>>({ desayuno: true });

  return (
    <div>
      {Object.entries(MEALS).map(([key, cat]) => {
        const isOpen = !!open[key];
        const color = ACCENT_COLORS[key] || "#E8E0D4";
        return (
          <div key={key} style={{
            background: "var(--cream)", borderRadius: 16,
            marginBottom: 10, border: "1px solid var(--border)", overflow: "hidden",
          }}>
            <button
              onClick={() => setOpen(p => ({ ...p, [key]: !p[key] }))}
              style={{
                width: "100%", padding: "14px 18px",
                background: "none", border: "none",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
                {cat.emoji} {cat.title}
              </span>
              <span style={{
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s", fontSize: 14, color: "var(--muted)",
              }}>▼</span>
            </button>
            {isOpen && (
              <div style={{ padding: "0 14px 14px" }}>
                {cat.options.map((opt, i) => (
                  <MealCard key={i} option={opt} color={color} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
