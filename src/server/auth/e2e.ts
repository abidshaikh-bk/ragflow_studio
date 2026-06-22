import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const E2E_AUTH_COOKIE_NAME = "ragflow_e2e_auth";

const E2E_AUTH_COOKIE_VALUE = "authenticated";

const E2E_AUTH_USER = {
  app_metadata: {},
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00.000Z",
  email: "playwright@ragflow.test",
  id: "00000000-0000-4000-8000-000000000028",
  role: "authenticated",
  user_metadata: {}
} as User;

export function isE2EAuthBypassEnabled() {
  return process.env.E2E_AUTH_BYPASS === "true";
}

export async function getE2EAuthenticatedUser() {
  if (!isE2EAuthBypassEnabled()) {
    return null;
  }

  const cookieStore = await cookies();
  const authCookie = cookieStore.get(E2E_AUTH_COOKIE_NAME);

  if (authCookie?.value !== E2E_AUTH_COOKIE_VALUE) {
    return null;
  }

  return E2E_AUTH_USER;
}

export function hasE2EAuthCookie(value?: string) {
  return value === E2E_AUTH_COOKIE_VALUE;
}
