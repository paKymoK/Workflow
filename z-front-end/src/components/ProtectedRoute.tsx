import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import AppLayout from "./AppLayout";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
