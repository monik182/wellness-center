import { useState } from "react";
import { GROCERY_LIST } from "../data/meals";

export default function ShoppingPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setChecked((p) => ({ ...p, [key]: !p[key] }));

  const allKeys = Object.values(GROCERY_LIST).flat();
  const checkedCount = allKeys.filter((k) => checked[k]).length;

  return (
    <div>
      <div style={{
        background: "var(--cream)", borderRadius: 16,
        padding: "10px 16px", marginBottom: 12,
        border: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>Progreso</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>
          {checkedCount}/{allKeys.length}
        </span>
      </div>

      {Object.entries(GROCERY_LIST).map(([cat, items]) => (
        <div key={cat} style={{
          background: "var(--cream)", borderRadius: 16,
          padding: 14, marginBottom: 8,
          border: "1px solid var(--border)",
        }}>
          <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 8px", color: "var(--ink)" }}>
            {cat}
          </p>
          {items.map((item, i) => (
            <label key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "5px 0", fontSize: 12.5, color: "var(--muted)",
              cursor: "pointer",
              textDecoration: checked[item] ? "line-through" : "none",
              opacity: checked[item] ? 0.5 : 1,
              transition: "all 0.15s",
            }}>
              <input
                type="checkbox"
                checked={!!checked[item]}
                onChange={() => toggle(item)}
                style={{ accentColor: "var(--green)", width: 15, height: 15, flexShrink: 0 }}
              />
              {item}
            </label>
          ))}
        </div>
      ))}

      {checkedCount > 0 && (
        <button
          onClick={() => setChecked({})}
          style={{
            width: "100%", padding: "10px", borderRadius: 24,
            border: "1px dashed var(--border)", background: "transparent",
            fontFamily: "'Poppins', sans-serif", fontSize: 12,
            color: "var(--muted)", marginTop: 4, cursor: "pointer",
          }}
        >
          Limpiar selección
        </button>
      )}
    </div>
  );
}
