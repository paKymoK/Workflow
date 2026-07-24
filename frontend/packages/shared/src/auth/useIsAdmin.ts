import { useAuth } from "./useAuth";

// Mirrors core-v1's Roles.ADMIN constant and the "roles" claim the auth-service
// token customizer embeds in the JWT (absent entirely for users with no global role).
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  const roles = user?.roles;
  return Array.isArray(roles) && roles.includes("ADMIN");
}
