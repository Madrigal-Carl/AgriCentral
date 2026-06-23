import { Navigate, Outlet } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import { getRoleRedirect } from "@/utils/getRoleRedirect";

export default function PublicOnlyRoute() {
  const { isAuthenticated, role } = useAuth();

  // Guests can access
  if (!isAuthenticated) {
    return <Outlet />;
  }

  // Redirect authenticated users
  return <Navigate to={getRoleRedirect(role)} replace />;
}
