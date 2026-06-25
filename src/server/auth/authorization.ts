import type { User } from "@supabase/supabase-js";

type AdminAwareUser = Pick<User, "app_metadata" | "user_metadata"> | null | undefined;

function includesAdminRole(value: unknown) {
  if (typeof value === "string") {
    return value.toLowerCase() === "admin";
  }

  if (Array.isArray(value)) {
    return value.some((entry) => typeof entry === "string" && entry.toLowerCase() === "admin");
  }

  return false;
}

export function isAdminUser(user: AdminAwareUser) {
  if (!user) {
    return false;
  }

  return [
    user.app_metadata?.role,
    user.app_metadata?.roles,
    user.user_metadata?.role,
    user.user_metadata?.roles
  ].some(includesAdminRole);
}
