import { useState, useCallback } from "react";
import TodayTab from "./calorie-tracker/TodayTab";
import LogMealTab, { type SelectorItem } from "./calorie-tracker/LogMealTab";
import HistoryTab from "./calorie-tracker/HistoryTab";
import type { Suggestion } from "./calorie-tracker/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Tab = "today" | "log" | "history";

const TAB_LABELS: Record<Tab, string> = {
  today:   "Hoy",
  log:     "Registrar",
  history: "Historial",
};

export default function CalorieTrackerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [selectorItems, setSelectorItems] = useState<SelectorItem[]>([]);
  const [cachedSuggestions, setCachedSuggestions] = useState<Suggestion[] | null>(null);

  const invalidateSuggestions = useCallback(() => setCachedSuggestions(null), []);

  return (
    <div className="pb-8">
      {/* Tab bar */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="mb-6">
        <TabsList className="w-full">
          {(["today", "log", "history"] as Tab[]).map((tab) => (
            <TabsTrigger key={tab} value={tab} className="flex-1">
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {activeTab === "today" && (
        <TodayTab
          onLogMore={() => setActiveTab("log")}
          cachedSuggestions={cachedSuggestions}
          onSuggestionsLoaded={setCachedSuggestions}
          onSuggestionsInvalidated={invalidateSuggestions}
        />
      )}
      {activeTab === "log" && (
        <LogMealTab
          selectorItems={selectorItems}
          setSelectorItems={setSelectorItems}
          onLogged={() => { invalidateSuggestions(); setActiveTab("today"); }}
        />
      )}
      {activeTab === "history" && <HistoryTab />}
    </div>
  );
}
