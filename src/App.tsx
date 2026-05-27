import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import MealsPage    from "./pages/MealsPage";
import SchedulePage from "./pages/SchedulePage";
import WheelPage    from "./pages/WheelPage";
import FoodsPage    from "./pages/FoodsPage";
import PrepPage     from "./pages/PrepPage";
import ShoppingPage from "./pages/ShoppingPage";
import RulesPage        from "./pages/RulesPage";
import MacroTargetsPage from "./pages/MacroTargetsPage";
import CalorieTrackerPage from "./pages/CalorieTrackerPage";
import "./styles/global.css";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"               element={<MealsPage />}         />
          <Route path="/schedule"       element={<SchedulePage />}     />
          <Route path="/wheel"          element={<WheelPage />}        />
          <Route path="/foods"          element={<FoodsPage />}        />
          <Route path="/prep"           element={<PrepPage />}         />
          <Route path="/shopping"       element={<ShoppingPage />}     />
          <Route path="/rules"          element={<RulesPage />}        />
          <Route path="/macro-targets"      element={<MacroTargetsPage />}      />
          <Route path="/calorie-tracker"    element={<CalorieTrackerPage />}    />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
