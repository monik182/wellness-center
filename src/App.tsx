import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import "./styles/global.css";

const FoodsPage = lazy(() => import("./pages/FoodsPage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));
const CalorieTrackerPage = lazy(() => import("./pages/CalorieTrackerPage"));
const NutritionLabelPage = lazy(() => import("./pages/NutritionLabelPage"));
const SaludMetabolicaPage = lazy(() => import("./pages/SaludMetabolicaPage"));
// const MealsPage = lazy(() => import("./pages/MealsPage"));
// const WheelPage = lazy(() => import("./pages/WheelPage"));
// const PrepPage = lazy(() => import("./pages/PrepPage"));
// const ShoppingPage = lazy(() => import("./pages/ShoppingPage"));
// const RulesPage = lazy(() => import("./pages/RulesPage"));
// const MacroTargetsPage = lazy(() => import("./pages/MacroTargetsPage"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-32">
    <span className="text-sm text-gray-500">Cargando...</span>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* <Route path="/" element={<MealsPage />} /> */}
            <Route path="/" element={<CalorieTrackerPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            {/* <Route path="/wheel" element={<WheelPage />} /> */}
            <Route path="/foods" element={<FoodsPage />} />
            {/* <Route path="/prep" element={<PrepPage />} /> */}
            {/* <Route path="/shopping" element={<ShoppingPage />} /> */}
            <Route path="/nutrition-label" element={<NutritionLabelPage />} />
            {/* <Route path="/rules" element={<RulesPage />} /> */}
            {/* <Route path="/macro-targets" element={<MacroTargetsPage />} /> */}
            <Route path="/salud-metabolica" element={<SaludMetabolicaPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}
