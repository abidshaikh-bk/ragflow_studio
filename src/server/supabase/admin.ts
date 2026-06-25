import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleEnv } from "@/lib/env";

export function createAdminSupabaseClient() {
  const { serviceRoleKey, url } = getSupabaseServiceRoleEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  });
}
