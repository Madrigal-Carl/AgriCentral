import { Navigate, Outlet } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import { getRoleRedirect } from "@/utils/getRoleRedirect";

export default function AuthRedirectRoute() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return null;
  }

  // Redirect admin/technician/cashier users to their role's default route
  if (
    isAuthenticated &&
    [
      ROLES.FAR,
      ROLES.AEW,
      ROLES.COORDINATOR,
      ROLES.GOVERNOR,
      ROLES.HEAD,
      ROLES.ADMIN,
    ].includes(role)
  ) {
    return <Navigate to={getRoleRedirect(role)} replace />;
  }

  // Allow guests to proceed
  return <Outlet />;
}
