import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../auth/AuthProvider";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/Login";
import Portfolio from "../pages/Portfolio";
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import TicketDetail from "../pages/TicketDetail";
import Callback from "../pages/Callback";
import Settings from "../pages/Settings";
import WorkflowDetail from "../pages/WorkflowDetail";
import Diary from "../pages/Diary";
import AMS from "../pages/AMS";
import Shop from "../pages/Shop";
import ShopDetail from "../pages/ShopDetail";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/ams" element={<AMS />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/callback" element={<Callback />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/:id" element={<TicketDetail />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:id" element={<ShopDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/workflow/:id" element={<WorkflowDetail />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
