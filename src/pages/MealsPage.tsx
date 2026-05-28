import { useState } from "react";
import { MEALS, type MealOption } from "../data/meals";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function MealCard({ option, color }: { option: MealOption; color: string }) {
  return (
    <Card className="mb-2.5" style={{ background: "var(--peach)" }}>
      <CardContent className="pt-3.5 pb-3.5">
        <div className="flex justify-between items-baseline mb-1.5 flex-wrap gap-1.5">
          <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{option.name}</span>
          <Badge className="text-xs font-medium" style={{ background: "var(--green)", color: "var(--ink)" }}>
            {option.kcal} kcal · {option.protein} prot
          </Badge>
        </div>
        <ul className="pl-4 text-[12.5px] leading-[1.7] my-1.5" style={{ color: "var(--ink-muted)" }}>
          {option.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
        </ul>
        {option.notes && (
          <div
            className="mt-2 px-2.5 py-2 text-xs leading-relaxed"
            style={{ background: "var(--cream)", borderLeft: `3px solid ${color}`, color: "var(--ink)" }}
          >
            💡 {option.notes}
          </div>
        )}
        {option.prep && (
          <p className="text-[11px] mt-1.5" style={{ color: "var(--ink-muted)" }}>⏱ {option.prep}</p>
        )}
      </CardContent>
    </Card>
  );
}

const ACCENT_COLORS: Record<string, string> = {
  desayuno:   "#FFD1A1",
  almuerzo:   "#B2D8B2",
  postre:     "#F5C6D0",
  snack:      "#E0BBE4",
  preworkout: "#BDE0FE",
};

export default function MealsPage() {
  const [open, setOpen] = useState<Record<string, boolean>>({ desayuno: true });

  return (
    <div className="flex flex-col gap-2.5">
      {Object.entries(MEALS).map(([key, cat]) => {
        const isOpen = !!open[key];
        const color = ACCENT_COLORS[key] || "#E8E0D4";
        return (
          <Collapsible
            key={key}
            open={isOpen}
            onOpenChange={(val) => setOpen(p => ({ ...p, [key]: val }))}
          >
            <Card className="overflow-hidden">
              <CollapsibleTrigger
                className="w-full px-4 py-3.5 flex justify-between items-center bg-transparent border-0 cursor-pointer"
              >
                <span className="text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
                  {cat.emoji} {cat.title}
                </span>
                <span
                  className="text-sm transition-transform duration-200"
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    color: "var(--ink-muted)",
                  }}
                >▼</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3.5 pb-3.5">
                  {cat.options.map((opt, i) => (
                    <MealCard key={i} option={opt} color={color} />
                  ))}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
