import { useState } from "react";
import { GROCERY_LIST } from "../data/meals";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ShoppingPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setChecked((p) => ({ ...p, [key]: !p[key] }));

  const allKeys = Object.values(GROCERY_LIST).flat();
  const checkedCount = allKeys.filter((k) => checked[k]).length;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="py-4 px-4 flex justify-between items-center">
          <span className="text-[13px]" style={{ color: "var(--ink-muted)" }}>Progreso</span>
          <span className="text-[13px] font-semibold" style={{ color: "var(--green)" }}>
            {checkedCount}/{allKeys.length}
          </span>
        </CardContent>
      </Card>

      {Object.entries(GROCERY_LIST).map(([cat, items]) => (
        <Card key={cat}>
          <CardContent className="pt-5 pb-5">
            <p className="font-semibold text-[13px] mb-2" style={{ color: "var(--ink)" }}>
              {cat}
            </p>
            {items.map((item, i) => (
              <label
                key={i}
                className="flex items-center gap-2.5 py-1 text-[12.5px] cursor-pointer transition-all duration-150"
                style={{
                  color: "var(--ink-muted)",
                  textDecoration: checked[item] ? "line-through" : "none",
                  opacity: checked[item] ? 0.5 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={!!checked[item]}
                  onChange={() => toggle(item)}
                  className="shrink-0 w-[15px] h-[15px]"
                  style={{ accentColor: "var(--green)" }}
                />
                {item}
              </label>
            ))}
          </CardContent>
        </Card>
      ))}

      {checkedCount > 0 && (
        <Button
          variant="outline"
          className="w-full mt-1"
          onClick={() => setChecked({})}
        >
          Limpiar selección
        </Button>
      )}
    </div>
  );
}
