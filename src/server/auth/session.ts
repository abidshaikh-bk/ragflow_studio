import { redirect } from "next/navigation";
import { getE2EAuthenticatedUser } from "@/server/auth/e2e";
import { createServerSupabaseClient } from "@/server/supabase/server";

export async function getAuthenticatedUser() {
  const e2eUser = await getE2EAuthenticatedUser();

  if (e2eUser) {
    return e2eUser;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
