import { useState } from "react";
import {
  FOODS, GROUP_ORDER, GROUP_COLORS, TAG_COLORS,
  type Food, type FoodGroup,
} from "../data/foods";

function MacroBadge({ value, label, highlight }: { value: string | number; label: string; highlight?: string }) {
  return (
    <div style={{
      background: "var(--beige)", borderRadius: 6,
      padding: "3px 6px", textAlign: "center",
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: highlight || "var(--ink)" }}>
        {typeof value === "number" ? value : value}
      </div>
      <div style={{ fontSize: 9.5, color: "var(--muted)" }}>{label}</div>
    </div>
  );
}

function FoodItem({ food }: { food: Food }) {
  const gc = GROUP_COLORS[food.group];
  const isEliminated = food.group === "❌ Eliminado";
  return (
    <div style={{
      background: "var(--cream)",
      borderRadius: 14, padding: 12, marginBottom: 8,
      border: isEliminated ? "1px dashed #ccc" : "1px solid var(--border)",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 6 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)" }}>
            {isEliminated ? "⚠️ " : ""}{food.name}
          </span>
          <span style={{ fontSize: 11.5, color: "var(--muted)", marginLeft: 6, fontStyle: "italic" }}>
            {food.portion}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 0 }}>
          <span style={{
            fontSize: 10, padding: "2px 7px", borderRadius: 10,
            background: gc.bg, color: gc.text, fontWeight: 500, whiteSpace: "nowrap",
          }}>
            {food.group}
          </span>
          {food.tags.map((tag, ti) => {
            const tc = TAG_COLORS[tag] || { bg: "var(--border)", text: "var(--ink)" };
            return (
              <span key={ti} style={{
                fontSize: 10, padding: "2px 7px", borderRadius: 10,
                background: tc.bg, color: tc.text, fontWeight: 500, whiteSpace: "nowrap",
              }}>
                {tag}
              </span>
            );
          })}
        </div>
      </div>

      {/* Macros grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, fontSize: 11 }}>
        <MacroBadge value={food.kcal} label="kcal" />
        <MacroBadge value={`${food.protein}g`} label="proteína" highlight={food.protein >= 8 ? "var(--green)" : undefined} />
        <MacroBadge value={`${food.carbs}g`} label="carbs" />
        <MacroBadge value={`${food.fat}g`} label="grasa" highlight={food.fat >= 8 ? "var(--lavender)" : undefined} />
        <MacroBadge value={`${food.sugar}g`} label="azúcar" highlight={food.sugar > 5 ? "var(--lavender)" : undefined} />
        <MacroBadge value={`${food.fiber}g`} label="fibra" highlight={food.fiber >= 3 ? "var(--green)" : undefined} />
      </div>
    </div>
  );
}

export default function FoodsPage() {
  const [search, setSearch] = useState("");
  const q = search.toLowerCase().trim();

  const filtered = q
    ? FOODS.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.group.toLowerCase().includes(q) ||
          f.tags.some((t) => t.toLowerCase().includes(q))
      )
    : FOODS;

  // Build ordered group list from filtered results
  const groups = GROUP_ORDER.filter((g) => filtered.some((f) => f.group === g));

  return (
    <div>
      {/* Sticky search */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, paddingBottom: 8, background: "var(--beige)" }}>
        <input
          type="text"
          placeholder="🔍 Buscar alimento, grupo o tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "11px 16px",
            borderRadius: 30, border: "1px solid var(--border)",
            background: "var(--cream)", fontFamily: "'Poppins', sans-serif",
            fontSize: 13.5, outline: "none", color: "var(--ink)",
          }}
        />
      </div>

      {groups.map((group: FoodGroup) => {
        const items = filtered.filter((f) => f.group === group);
        return (
          <div key={group}>
            <p style={{
              fontSize: 12, fontWeight: 600, color: "var(--muted)",
              margin: "14px 0 8px 4px",
              textTransform: "uppercase", letterSpacing: 0.5,
            }}>
              {group}
            </p>
            {items
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((food, i) => <FoodItem key={i} food={food} />)}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 24 }}>
          No se encontró "{search}"
        </p>
      )}
    </div>
  );
}
