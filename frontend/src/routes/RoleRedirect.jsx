import { Navigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";
import { getRoleRedirect } from "@/utils/getRoleRedirect";
import { FullScreenLoader } from "@/components/public/FullScreenLoader";

export default function RoleRedirect() {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Redirect authenticated users
  return <Navigate to={getRoleRedirect(role)} replace />;
}
