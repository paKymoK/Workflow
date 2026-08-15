import { Navigate, Outlet } from "react-router-dom";
import { useIsAdmin } from "@takypok/shared";

// Auth itself is already guaranteed by the outer ProtectedRoute this nests inside —
// this only adds the ADMIN-role check on top.
export default function AdminGate() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
