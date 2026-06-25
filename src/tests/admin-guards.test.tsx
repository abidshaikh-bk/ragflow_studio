import React from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminPage from "@/app/(app)/admin/page";
import { GET } from "@/app/api/admin/access/route";
import { requireAdminPageAccess } from "@/server/auth/authorization";

const redirectMock = vi.fn();
const requireAuthenticatedUserMock = vi.fn();
const getUserMock = vi.fn();
const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({
  maybeSingle: maybeSingleMock
}));
const selectMock = vi.fn(() => ({
  eq: eqMock
}));
const fromMock = vi.fn(() => ({
  select: selectMock
}));
const supabaseMock = {
  auth: {
    getUser: getUserMock
  },
  from: fromMock
};

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
  usePathname: () => "/admin",
  useRouter: () => ({
    push: vi.fn()
  })
}));

vi.mock("@/server/auth/session", () => ({
  requireAuthenticatedUser: () => requireAuthenticatedUserMock()
}));

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: async () => supabaseMock
}));

describe("admin guards", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    requireAuthenticatedUserMock.mockReset();
    getUserMock.mockReset();
    maybeSingleMock.mockReset();
    eqMock.mockClear();
    selectMock.mockClear();
    fromMock.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          data: {
            systemPrompt: "",
            toolPolicy: {
              enableDateTime: true,
              enableVectorSearch: true,
              enableWebSearch: true
            },
            updatedAt: "2026-06-25T10:00:00.000Z"
          }
        }),
        ok: true
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects non-admin page requests back to chat", async () => {
    requireAuthenticatedUserMock.mockResolvedValue({
      app_metadata: {},
      email: "user@example.com",
      id: "user-123",
      user_metadata: {}
    });
    maybeSingleMock.mockResolvedValue({
      data: {
        is_admin: false
      },
      error: null
    });

    await requireAdminPageAccess();

    expect(redirectMock).toHaveBeenCalledWith("/chat");
  });

  it("renders the admin page for admins", async () => {
    requireAuthenticatedUserMock.mockResolvedValue({
      app_metadata: {},
      email: "admin@example.com",
      id: "user-123",
      user_metadata: {}
    });
    maybeSingleMock.mockResolvedValue({
      data: {
        is_admin: true
      },
      error: null
    });

    render(await AdminPage());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByRole("heading", { name: /shared assistant control plane/i })
    ).toBeInTheDocument();
  });

  it("returns 403 for non-admin API requests and 200 for admins", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          app_metadata: {},
          id: "user-123",
          user_metadata: {}
        }
      }
    });
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        is_admin: false
      },
      error: null
    });

    const forbiddenResponse = await GET();
    expect(forbiddenResponse.status).toBe(403);

    maybeSingleMock.mockResolvedValueOnce({
      data: {
        is_admin: true
      },
      error: null
    });

    const allowedResponse = await GET();
    expect(allowedResponse.status).toBe(200);
  });
});
