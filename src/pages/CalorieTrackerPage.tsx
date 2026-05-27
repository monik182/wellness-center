import { useState } from "react";
import TodayTab from "./calorie-tracker/TodayTab";
import LogMealTab, { type SelectorItem } from "./calorie-tracker/LogMealTab";
import HistoryTab from "./calorie-tracker/HistoryTab";

type Tab = "today" | "log" | "history";

const TAB_LABELS: Record<Tab, string> = {
  today:   "Hoy",
  log:     "Registrar",
  history: "Historial",
};

export default function CalorieTrackerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  // Selector state lives here so it persists across tab switches within this page
  const [selectorItems, setSelectorItems] = useState<SelectorItem[]>([]);

  return (
    <div style={{ padding: "0 14px 32px" }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["today", "log", "history"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: activeTab === tab ? "var(--ink)" : "var(--cream)",
              color: activeTab === tab ? "var(--cream)" : "var(--muted)",
              fontSize: 12,
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {activeTab === "today" && (
        <TodayTab onLogMore={() => setActiveTab("log")} />
      )}
      {activeTab === "log" && (
        <LogMealTab
          selectorItems={selectorItems}
          setSelectorItems={setSelectorItems}
          onLogged={() => setActiveTab("today")}
        />
      )}
      {activeTab === "history" && <HistoryTab />}
    </div>
  );
}
