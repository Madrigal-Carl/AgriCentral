import { Navigate, Outlet } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { FullScreenLoader } from "@/components/public";

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Role not allowed
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
