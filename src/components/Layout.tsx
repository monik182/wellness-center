import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/",             label: "Comidas",   emoji: "🍽️" },
  { to: "/schedule",     label: "Horarios",  emoji: "⏰" },
  { to: "/macro-targets", label: "Macros",   emoji: "🎯" },
  { to: "/wheel",        label: "Wheel",     emoji: "🎡" },
  { to: "/foods",        label: "Alimentos", emoji: "📊" },
  { to: "/prep",         label: "Prep",      emoji: "🔪" },
  { to: "/shopping",     label: "Compras",   emoji: "🛒" },
  { to: "/rules",            label: "Reglas",   emoji: "📏" },
  { to: "/calorie-tracker", label: "Tracker",  emoji: "📝" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{
        textAlign: "center",
        padding: "20px 16px 8px",
        background: "var(--beige)",
        position: "sticky",
        top: 0,
        zIndex: 20,
        borderBottom: "1px solid var(--border)",
      }}>
        <h1 style={{
          fontFamily: "'La Belle Aurore', cursive",
          fontSize: 26,
          fontWeight: 400,
          color: "var(--ink)",
          margin: 0,
        }}>
          Plan de comidas
        </h1>
        <p style={{ fontSize: 11, color: "var(--muted)", fontWeight: 300, margin: "2px 0 0" }}>
          ~1,500 kcal/día · Gym mañana/tarde + descanso
        </p>
      </header>

      {/* Top nav (scrollable) */}
      <nav style={{
        display: "flex",
        gap: 4,
        padding: "8px 8px",
        overflowX: "auto",
        background: "var(--beige)",
        scrollbarWidth: "none",
        flexShrink: 0,
        borderBottom: "1px solid var(--border)",
      }}>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            style={({ isActive }) => ({
              padding: "7px 12px",
              borderRadius: 24,
              border: "none",
              background: isActive ? "var(--ink)" : "var(--cream)",
              color: isActive ? "var(--cream)" : "var(--muted)",
              fontSize: 11.5,
              fontWeight: isActive ? 600 : 400,
              whiteSpace: "nowrap",
              transition: "all 0.18s",
              fontFamily: "'Poppins', sans-serif",
              flexShrink: 0,
            })}
          >
            {item.emoji} {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Page content */}
      <main style={{ flex: 1, padding: "12px 10px 32px" }}>
        {children}
      </main>
    </div>
  );
}
