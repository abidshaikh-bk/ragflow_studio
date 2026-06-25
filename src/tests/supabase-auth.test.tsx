import React from "react";
import { render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProtectedLayout from "@/app/(app)/layout";
import { updateSession } from "@/server/supabase/middleware";

const createServerClientMock = vi.fn();
const requireAuthenticatedUserMock = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => createServerClientMock(...args)
}));

vi.mock("@/server/auth/session", () => ({
  requireAuthenticatedUser: () => requireAuthenticatedUserMock()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/chat",
  useRouter: () => ({
    push: vi.fn()
  })
}));

describe("Supabase auth protection", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
    requireAuthenticatedUserMock.mockReset();

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
  });

  it("redirects unauthenticated protected requests to login", async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: null
          }
        })
      }
    });

    const request = new NextRequest("http://localhost:3000/documents");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fdocuments"
    );
  });

  it("protects the new history route with the same authenticated redirect", async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: null
          }
        })
      }
    });

    const request = new NextRequest("http://localhost:3000/history");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fhistory"
    );
  });

  it("allows authenticated protected requests to continue", async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-123",
              email: "abid@example.com"
            }
          }
        })
      }
    });

    const request = new NextRequest("http://localhost:3000/chat");
    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("renders protected content for an authenticated layout session", async () => {
    requireAuthenticatedUserMock.mockResolvedValue({
      app_metadata: {
        role: "admin"
      },
      email: "abid@example.com"
    });

    render(
      await ProtectedLayout({
        children: <div>Secure dashboard</div>
      })
    );

    expect(screen.getByText("Secure dashboard")).toBeInTheDocument();
    expect(screen.getByText("abid@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Admin" })).toBeInTheDocument();
  });
});
