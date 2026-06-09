import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import type { LoggedFoodItem } from "../types";
import {
  calcMealGlucoseCurve,
  calcMealGL,
  getGLBadgeColor,
  getGLLabel,
} from "../utils/glucoseModel";

interface MetabolicImpactChartProps {
  items: LoggedFoodItem[];
  consumptionOrder?: number[];
}

export function MetabolicImpactChart({
  items,
  consumptionOrder,
}: MetabolicImpactChartProps) {
  const dataPoints = calcMealGlucoseCurve(items, consumptionOrder);
  const mealGL = calcMealGL(items);
  const netCarbs = Math.max(0, items.reduce((s, i) => s + i.carbs - i.fiber, 0));
  const glColor = getGLBadgeColor(mealGL);
  const glLabel = getGLLabel(mealGL);

  return (
    <div>
      {/* Chart */}
      <div className="mb-4">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dataPoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorImpact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={glColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={glColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time_minutes"
              tick={{ fontSize: 12 }}
              label={{ value: "Minutos después de comer", position: "insideBottom", offset: -5 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: "Impacto estimado", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{ background: "var(--beige)", border: "1px solid var(--border-color)" }}
              formatter={(value) => `${typeof value === "number" ? value.toFixed(1) : value}`}
              labelFormatter={(label) => `${label} min`}
            />
            <Area
              type="monotone"
              dataKey="impact"
              stroke={glColor}
              fill="url(#colorImpact)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Disclaimer */}
      <p
        className="text-[11px] mb-3 px-2 py-1.5 rounded"
        style={{ background: "#fef3c7", color: "#92400e" }}
      >
        ⚠️ Modelo aproximado basado en índice y carga glucémica. No es una medición real de glucosa en sangre.
      </p>

      {/* Summary metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: "var(--ink-muted)" }}>Carga Glucémica Total:</span>
          <span style={{ color: "var(--ink)" }}>
            <strong>{mealGL.toFixed(1)}</strong>{" "}
            <span
              className="inline-block px-2 py-0.5 rounded"
              style={{ background: glColor, color: "white", fontSize: "10px" }}
            >
              {glLabel}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span style={{ color: "var(--ink-muted)" }}>Carbohidratos Netos:</span>
          <span style={{ color: "var(--ink)" }}>
            <strong>{netCarbs.toFixed(1)}g</strong>
          </span>
        </div>

        {consumptionOrder && consumptionOrder.length >= 2 && (
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "var(--ink-muted)" }}>Orden de consumo:</span>
            <span style={{ color: "var(--ink)" }}>
              {consumptionOrder.map((idx) => items[idx]?.name).join(" → ")}
            </span>
          </div>
        )}
      </div>

      {/* Tip if applicable */}
      {items.some((i) => i.gi && i.gi > 55) && !consumptionOrder && (
        <div
          className="mt-3 px-2.5 py-1.5 rounded text-[11px]"
          style={{ background: "var(--beige)", color: "var(--ink-muted)" }}
        >
          💡 <strong>Consejo:</strong> Comer la proteína y fibra antes de los carbohidratos puede reducir el impacto glucémico hasta un 37%.
        </div>
      )}
    </div>
  );
}
