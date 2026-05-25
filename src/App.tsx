import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import MealsPage    from "./pages/MealsPage";
import SchedulePage from "./pages/SchedulePage";
import WheelPage    from "./pages/WheelPage";
import FoodsPage    from "./pages/FoodsPage";
import PrepPage     from "./pages/PrepPage";
import ShoppingPage from "./pages/ShoppingPage";
import RulesPage    from "./pages/RulesPage";
import "./styles/global.css";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"         element={<MealsPage />}    />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/wheel"    element={<WheelPage />}    />
          <Route path="/foods"    element={<FoodsPage />}    />
          <Route path="/prep"     element={<PrepPage />}     />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/rules"    element={<RulesPage />}    />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
