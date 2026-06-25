import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/auth/logout/route";

const signOutMock = vi.fn();
const isE2EAuthBypassEnabledMock = vi.fn(() => true);

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: {
      signOut: signOutMock
    }
  })
}));

vi.mock("@/server/auth/e2e", () => ({
  E2E_AUTH_COOKIE_NAME: "ragflow_e2e_auth",
  isE2EAuthBypassEnabled: () => isE2EAuthBypassEnabledMock()
}));

describe("/api/auth/logout route", () => {
  beforeEach(() => {
    signOutMock.mockReset();
    isE2EAuthBypassEnabledMock.mockReset();
    isE2EAuthBypassEnabledMock.mockReturnValue(true);
  });

  it("signs out and returns the login redirect payload", async () => {
    signOutMock.mockResolvedValue({
      error: null
    });

    const response = await POST();

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: {
        redirectTo: "/login"
      }
    });
    expect(response.headers.get("set-cookie")).toContain("ragflow_e2e_auth=");
  });

  it("returns method not allowed for GET requests", async () => {
    const response = await GET();

    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({
      error: "Method not allowed"
    });
  });

  it("masks internal sign-out errors", async () => {
    signOutMock.mockResolvedValue({
      error: {
        message: "supabase service token leaked"
      }
    });

    const response = await POST();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Unable to sign out right now."
    });
  });

  it("ignores missing-session errors so logout stays idempotent", async () => {
    signOutMock.mockResolvedValue({
      error: {
        message: "Auth session missing!"
      }
    });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: {
        redirectTo: "/login"
      }
    });
  });
});
