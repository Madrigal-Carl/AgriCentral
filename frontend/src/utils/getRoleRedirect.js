import { ROLE_ROUTES } from "@/constants/routes";

export function getRoleRedirect(role) {
  return ROLE_ROUTES[role] || "/";
}
