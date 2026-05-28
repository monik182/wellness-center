import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/",                label: "Comidas",   emoji: "🍽️" },
  { to: "/schedule",        label: "Horarios",  emoji: "⏰" },
  { to: "/macro-targets",   label: "Macros",    emoji: "🎯" },
  { to: "/wheel",           label: "Wheel",     emoji: "🎡" },
  { to: "/foods",           label: "Alimentos", emoji: "📊" },
  { to: "/prep",            label: "Prep",      emoji: "🔪" },
  { to: "/shopping",        label: "Compras",   emoji: "🛒" },
  { to: "/rules",           label: "Reglas",    emoji: "📏" },
  { to: "/calorie-tracker", label: "Tracker",   emoji: "📝" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--beige)] border-b border-[var(--border-color)] text-center px-4 pt-5 pb-2">
        <h1 style={{ fontFamily: "'La Belle Aurore', cursive", fontSize: 26, fontWeight: 400, color: "var(--ink)", margin: 0 }}>
          Plan de comidas
        </h1>
        <p className="text-[11px] font-light mt-0.5" style={{ color: "var(--ink-muted)" }}>
          ~1,500 kcal/día · Gym mañana/tarde + descanso
        </p>
      </header>

      {/* Top nav (scrollable) */}
      <nav
        className="flex gap-1 px-2 py-2 bg-[var(--beige)] border-b border-[var(--border-color)] overflow-x-auto shrink-0"
        style={{ scrollbarWidth: "none" }}
      >
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "px-3 py-1.5 rounded-sm text-[11.5px] whitespace-nowrap shrink-0 transition-all duration-[180ms] border-0",
                isActive
                  ? "bg-[var(--ink)] text-[var(--cream)] font-semibold"
                  : "bg-[var(--cream)] font-normal",
              )
            }
            style={({ isActive }) => ({ color: isActive ? "var(--cream)" : "var(--ink-muted)" })}
          >
            {item.emoji} {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Page content */}
      <main className="flex-1 px-2.5 pt-3 pb-8">
        {children}
      </main>
    </div>
  );
}
