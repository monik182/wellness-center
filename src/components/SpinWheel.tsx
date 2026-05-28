import { useState, useRef, useCallback } from "react";
import type { WheelItem } from "../data/foods";
import { WHEEL_CATEGORY_META, type WheelCategory } from "../data/foods";
import { Card, CardContent } from "@/components/ui/card";

interface SpinWheelProps {
  category: WheelCategory;
  items: WheelItem[];
  selected: WheelItem | null;
  onResult: (item: WheelItem) => void;
}

export default function SpinWheel({ category, items, selected, onResult }: SpinWheelProps) {
  const meta = WHEEL_CATEGORY_META[category];
  const count = items.length;
  const anglePerSlice = 360 / count;

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelItem | null>(selected);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const wheelRef = useRef<SVGSVGElement>(null);

  const spin = useCallback(() => {
    if (spinning || count === 0) return;
    setSpinning(true);
    setResult(null);
    setHoveredIndex(null);

    const winIndex = Math.floor(Math.random() * count);
    const winner = items[winIndex];
    const sliceMidAngle = winIndex * anglePerSlice + anglePerSlice / 2;
    const targetAngle = (360 - sliceMidAngle) % 360;
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const currentMod = rotation % 360;
    const totalRotation = rotation + (360 - currentMod) + extraSpins * 360 + targetAngle;

    setRotation(totalRotation);

    setTimeout(() => {
      setResult(winner);
      setSpinning(false);
      onResult(winner);
    }, 3200);
  }, [spinning, rotation, items, count, anglePerSlice, onResult]);

  const radius = 130, cx = 150, cy = 150;
  const maxChars = count > 6 ? 12 : 14;

  const parseHex = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });
  const base = parseHex(meta.color);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-center m-0" style={{ fontFamily: "'La Belle Aurore', cursive", fontSize: 22, color: "var(--ink)" }}>
        {meta.label}
      </p>

      <div className="relative w-[300px] h-[300px]">
        {/* Pointer */}
        <div
          className="absolute top-[-8px] left-1/2 z-[2]"
          style={{
            transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: "20px solid var(--ink)",
            filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.15))",
          }}
        />

        {/* Hover tooltip */}
        {hoveredIndex !== null && !spinning && (
          <div
            className="absolute top-[-40px] left-1/2 z-[3] text-xs font-medium whitespace-nowrap pointer-events-none px-3 py-1.5"
            style={{
              transform: "translateX(-50%)",
              background: "var(--ink)",
              color: "var(--cream)",
            }}
          >
            {items[hoveredIndex].name}
          </div>
        )}

        <svg
          ref={wheelRef}
          width="300" height="300" viewBox="0 0 300 300"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
            cursor: spinning ? "wait" : "pointer",
          }}
          onClick={spin}
        >
          {items.map((item, i) => {
            const startAngle = i * anglePerSlice - 90;
            const endAngle = startAngle + anglePerSlice;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const x1 = cx + radius * Math.cos(startRad), y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad), y2 = cy + radius * Math.sin(endRad);
            const largeArc = anglePerSlice > 180 ? 1 : 0;
            const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
            const textR = radius * 0.65;
            const tx = cx + textR * Math.cos(midAngle), ty = cy + textR * Math.sin(midAngle);
            const textAngle = (startAngle + endAngle) / 2;
            const l = i % 2 === 0 ? 0 : 15;
            const darken = hoveredIndex === i ? 30 : l;
            const fill = `rgb(${Math.max(0, base.r - darken)},${Math.max(0, base.g - darken)},${Math.max(0, base.b - darken)})`;
            const displayName = item.name.length > maxChars ? item.name.slice(0, maxChars - 1) + "…" : item.name;

            return (
              <g
                key={i}
                onMouseEnter={() => !spinning && setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: spinning ? "wait" : "pointer" }}
              >
                <path
                  d={`M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 ${largeArc} 1 ${x2},${y2} Z`}
                  fill={fill} stroke="var(--cream)" strokeWidth="2"
                />
                <text
                  x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                  transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                  style={{ fontSize: count > 6 ? 9 : 11, fontFamily: "'Poppins', sans-serif", fontWeight: 500, fill: "var(--ink)", pointerEvents: "none" }}
                >
                  {displayName}
                </text>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r="28" fill="var(--cream)" stroke="var(--border-color)" strokeWidth="2" />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: 11, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fill: "var(--ink)", pointerEvents: "none" }}>
            {spinning ? "..." : "GIRAR"}
          </text>
        </svg>
      </div>

      {result && !spinning && (
        <Card className="text-center min-w-[220px] fade-up" style={{ borderWidth: 2, borderColor: meta.color }}>
          <CardContent className="pt-3 pb-3">
            <p className="font-semibold text-[15px] mb-0.5" style={{ color: "var(--ink)" }}>{result.name}</p>
            <p className="text-xs mb-1" style={{ color: "var(--ink-muted)" }}>{result.portion}</p>
            <div className="flex gap-3 justify-center text-xs">
              <span style={{ color: "var(--ink-muted)" }}>{result.kcal} kcal</span>
              <span className="font-semibold" style={{ color: "var(--green)" }}>{result.protein}g prot</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!result && !spinning && (
        <p className="text-xs italic m-0" style={{ color: "var(--ink-muted)" }}>
          Toca la rueda para girar
        </p>
      )}
    </div>
  );
}
