import { Navigate, Outlet } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "@takypok/shared";
import AppLayout from "./AppLayout";
import { CartProvider } from "../context/CartContext";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated && !sessionStorage.getItem("access_token")) {
    return <Navigate to="/login" replace />;
  }

  return (
    <CartProvider>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </CartProvider>
  );
}
