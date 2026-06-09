import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/calorie-tracker", label: "Tracker",   emoji: "📝" },
  { to: "/",                label: "Comidas",   emoji: "🍽️" },
  { to: "/schedule",        label: "Horarios",  emoji: "⏰" },
  { to: "/macro-targets",   label: "Macros",    emoji: "🎯" },
  { to: "/wheel",           label: "Wheel",     emoji: "🎡" },
  { to: "/foods",           label: "Alimentos", emoji: "📊" },
  { to: "/nutrition-label", label: "Etiquetas", emoji: "📋" },
  { to: "/salud-metabolica", label: "Glucemia", emoji: "💚" },
  { to: "/prep",            label: "Prep",      emoji: "🔪" },
  { to: "/shopping",        label: "Compras",   emoji: "🛒" },
  { to: "/rules",           label: "Reglas",    emoji: "📏" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleOffline = () => {
      console.log("Sin conexión. Los datos se actualizarán cuando vuelvas a estar en línea.");
    };
    window.addEventListener("offline", handleOffline);
    return () => window.removeEventListener("offline", handleOffline);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--beige)] border-b border-[var(--border-color)] text-center px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3">
        <h1 style={{ fontFamily: "'La Belle Aurore', cursive", fontSize: 26, fontWeight: 400, color: "var(--ink)", margin: 0 }}>
          Wellness Center
        </h1>
        <p className="text-[11px] font-light mt-0.5" style={{ color: "var(--ink-muted)" }}>
          ~1,500 kcal/día · Gym mañana/tarde + descanso
        </p>
      </header>

      {/* Top nav (scrollable) */}
      <nav
        className="flex gap-1.5 px-3 py-2.5 bg-[var(--beige)] border-b border-[var(--border-color)] overflow-x-auto shrink-0"
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
      <main className="flex-1 px-4 pt-6 pb-[calc(3rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
