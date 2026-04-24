import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../auth/AuthProvider";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/Login";
import Callback from "../pages/Callback";
import Shop from "../pages/Shop";
import ShopDetail from "../pages/ShopDetail";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<Callback />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Shop />} />
            <Route path="/:id" element={<ShopDetail />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
