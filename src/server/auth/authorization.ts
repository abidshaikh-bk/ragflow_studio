import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/server/auth/session";
import { createServerSupabaseClient } from "@/server/supabase/server";

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
  ].some(includesAdminRole);
}

export async function getAdminAccessState(input: {
  supabase: SupabaseClient;
  user: AdminAwareUser & {
    id: string;
  };
}) {
  const result = await input.supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", input.user.id)
    .maybeSingle();

  if (!result.error && typeof result.data?.is_admin === "boolean") {
    return result.data.is_admin || isAdminUser(input.user);
  }

  return isAdminUser(input.user);
}

export async function requireAdminPageAccess() {
  const user = await requireAuthenticatedUser();
  const supabase = await createServerSupabaseClient();
  const isAdmin = await getAdminAccessState({
    supabase,
    user
  });

  if (!isAdmin) {
    redirect("/chat");
  }

  return {
    isAdmin,
    supabase,
    user
  };
}
