import { useState, useRef, useCallback } from "react";
import type { WheelItem } from "../data/foods";
import { WHEEL_CATEGORY_META, type WheelCategory } from "../data/foods";

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

  // Parse hex color to rgb components for darkening
  const parseHex = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });
  const base = parseHex(meta.color);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <p style={{ fontFamily: "'La Belle Aurore', cursive", fontSize: 22, color: "var(--ink)", margin: 0, textAlign: "center" }}>
        {meta.label}
      </p>

      <div style={{ position: "relative", width: 300, height: 300 }}>
        {/* Pointer */}
        <div style={{
          position: "absolute", top: -8, left: "50%",
          transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderTop: "20px solid var(--ink)",
          zIndex: 2, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.15))",
        }} />

        {/* Hover tooltip */}
        {hoveredIndex !== null && !spinning && (
          <div style={{
            position: "absolute", top: -40, left: "50%",
            transform: "translateX(-50%)",
            background: "var(--ink)", color: "var(--cream)",
            padding: "5px 12px", borderRadius: 8,
            fontSize: 12, fontWeight: 500,
            whiteSpace: "nowrap", zIndex: 3, pointerEvents: "none",
          }}>
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
          <circle cx={cx} cy={cy} r="28" fill="var(--cream)" stroke="var(--border)" strokeWidth="2" />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: 11, fontFamily: "'Poppins', sans-serif", fontWeight: 600, fill: "var(--ink)", pointerEvents: "none" }}>
            {spinning ? "..." : "GIRAR"}
          </text>
        </svg>
      </div>

      {result && !spinning && (
        <div style={{
          background: "var(--cream)", borderRadius: 14,
          padding: "12px 20px", border: `2px solid ${meta.color}`,
          textAlign: "center", minWidth: 220,
          animation: "fadeUp 0.3s ease",
        }}>
          <p style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)", margin: "0 0 2px" }}>{result.name}</p>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 4px" }}>{result.portion}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", fontSize: 12 }}>
            <span style={{ color: "var(--muted)" }}>{result.kcal} kcal</span>
            <span style={{ color: "var(--green)", fontWeight: 600 }}>{result.protein}g prot</span>
          </div>
        </div>
      )}

      {!result && !spinning && (
        <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, fontStyle: "italic" }}>
          Toca la rueda para girar
        </p>
      )}
    </div>
  );
}
