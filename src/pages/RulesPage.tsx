import { KEY_RULES, WHAT_CHANGED, SWEETS_RULES } from "../data/meals";
import { Card, CardContent } from "@/components/ui/card";

export default function RulesPage() {
  return (
    <div className="flex flex-col gap-3">
      {/* Key rules */}
      <Card style={{ background: "var(--peach)" }}>
        <CardContent className="pt-4">
          <p className="font-semibold text-sm mb-2.5" style={{ color: "var(--ink)" }}>
            ⚡ Las 2 reglas clave
          </p>
          {KEY_RULES.map((rule, i) => (
            <p key={i} className="text-[13px] font-medium mb-2 leading-relaxed" style={{ color: "var(--ink)" }}>
              {i + 1}. {rule}
            </p>
          ))}
        </CardContent>
      </Card>

      {/* What changed */}
      <Card>
        <CardContent className="pt-4">
          <p className="font-semibold text-sm mb-2.5" style={{ color: "var(--ink)" }}>
            🔧 Lo que cambió
          </p>
          {WHAT_CHANGED.map(({ what, change, saving }, i) => (
            <div
              key={i}
              className="py-1.5 text-[12.5px] leading-relaxed"
              style={{
                borderBottom: i < WHAT_CHANGED.length - 1 ? "1px solid var(--beige)" : "none",
                color: "var(--ink-muted)",
              }}
            >
              <span className="font-semibold" style={{ color: "var(--ink)" }}>{what}:</span> {change}
              <br />
              <span className="font-medium" style={{ color: "var(--green)" }}>→ {saving}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sweets rules */}
      <Card>
        <CardContent className="pt-4">
          <p className="font-semibold text-sm mb-2.5" style={{ color: "var(--ink)" }}>
            🍫 Reglas del dulce
          </p>
          {SWEETS_RULES.map((rule, i) => (
            <p
              key={i}
              className="text-[12.5px] mb-2 leading-relaxed pl-2"
              style={{ color: "var(--ink-muted)", borderLeft: "2px solid var(--lavender)" }}
            >
              {rule}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
