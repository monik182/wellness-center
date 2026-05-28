import { useState } from "react";
import {
  FOODS, GROUP_ORDER, GROUP_COLORS, TAG_COLORS,
  type Food, type FoodGroup,
} from "../data/foods";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

function MacroBadge({ value, label, highlight }: { value: string | number; label: string; highlight?: string }) {
  return (
    <div className="text-center px-1.5 py-0.5" style={{ background: "var(--beige)" }}>
      <div className="text-[13px] font-bold" style={{ color: highlight || "var(--ink)" }}>
        {value}
      </div>
      <div className="text-[9.5px]" style={{ color: "var(--ink-muted)" }}>{label}</div>
    </div>
  );
}

function FoodItem({ food }: { food: Food }) {
  const gc = GROUP_COLORS[food.group];
  const isEliminated = food.group === "❌ Eliminado";
  return (
    <Card className="mb-2" style={{ borderStyle: isEliminated ? "dashed" : "solid", borderColor: isEliminated ? "#ccc" : undefined }}>
      <CardContent className="pt-3 pb-3">
        {/* Header row */}
        <div className="flex justify-between items-start mb-2 gap-1.5">
          <div className="flex-1">
            <span className="font-semibold text-[13.5px]" style={{ color: "var(--ink)" }}>
              {isEliminated ? "⚠️ " : ""}{food.name}
            </span>
            <span className="text-[11.5px] ml-1.5 italic" style={{ color: "var(--ink-muted)" }}>
              {food.portion}
            </span>
          </div>
          <div className="flex gap-1 flex-wrap justify-end shrink-0">
            <Badge className="text-[10px] px-1.5 py-0 font-medium" style={{ background: gc.bg, color: gc.text }}>
              {food.group}
            </Badge>
            {food.tags.map((tag, ti) => {
              const tc = TAG_COLORS[tag] || { bg: "var(--border-color)", text: "var(--ink)" };
              return (
                <Badge key={ti} className="text-[10px] px-1.5 py-0 font-medium" style={{ background: tc.bg, color: tc.text }}>
                  {tag}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Macros grid */}
        <div className="grid grid-cols-3 gap-1 text-[11px]">
          <MacroBadge value={food.kcal} label="kcal" />
          <MacroBadge value={`${food.protein}g`} label="proteína" highlight={food.protein >= 8 ? "var(--green)" : undefined} />
          <MacroBadge value={`${food.carbs}g`} label="carbs" />
          <MacroBadge value={`${food.fat}g`} label="grasa" highlight={food.fat >= 8 ? "var(--lavender)" : undefined} />
          <MacroBadge value={`${food.sugar}g`} label="azúcar" highlight={food.sugar > 5 ? "var(--lavender)" : undefined} />
          <MacroBadge value={`${food.fiber}g`} label="fibra" highlight={food.fiber >= 3 ? "var(--green)" : undefined} />
        </div>
      </CardContent>
    </Card>
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

  const groups = GROUP_ORDER.filter((g) => filtered.some((f) => f.group === g));

  return (
    <div>
      {/* Sticky search */}
      <div className="sticky top-0 z-5 pb-2" style={{ background: "var(--beige)" }}>
        <Input
          type="text"
          placeholder="🔍 Buscar alimento, grupo o tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-[13.5px]"
          style={{ background: "var(--cream)", color: "var(--ink)" }}
        />
      </div>

      {groups.map((group: FoodGroup) => {
        const items = filtered.filter((f) => f.group === group);
        return (
          <div key={group}>
            <p className="text-xs font-semibold uppercase tracking-wide mt-3.5 mb-2 ml-1" style={{ color: "var(--ink-muted)" }}>
              {group}
            </p>
            {items
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((food, i) => <FoodItem key={i} food={food} />)}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <p className="text-center text-[13px] mt-6" style={{ color: "var(--ink-muted)" }}>
          No se encontró "{search}"
        </p>
      )}
    </div>
  );
}
