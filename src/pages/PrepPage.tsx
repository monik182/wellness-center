import { PREP_GUIDE } from "../data/meals";
import { Card, CardContent } from "@/components/ui/card";

export default function PrepPage() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="pt-5 pb-5">
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--ink)" }}>
            🕐 Tiempo total: ~1.5 horas
          </p>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            Domingo (o cuando puedas). Te dura 4-5 días.
          </p>
        </CardContent>
      </Card>

      {PREP_GUIDE.map((step, i) => (
        <Card key={i}>
          <CardContent className="pt-5 pb-5 flex gap-3">
            <div
              className="w-[34px] h-[34px] flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: "var(--blue)", borderRadius: "50%", color: "var(--ink)" }}
            >
              {step.step}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-baseline">
                <p className="font-semibold text-[13px] mb-0.5" style={{ color: "var(--ink)" }}>
                  {step.title}
                </p>
                <span className="text-[11px] font-medium" style={{ color: "var(--ink-muted)" }}>{step.time}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                {step.detail}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
