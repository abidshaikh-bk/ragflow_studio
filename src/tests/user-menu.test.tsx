import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserMenu } from "@/components/app-shell/UserMenu";

const pushMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      signOut: signOutMock
    }
  })
}));

describe("UserMenu", () => {
  beforeEach(() => {
    pushMock.mockReset();
    signOutMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("calls the logout route and redirects to login", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            redirectTo: "/login"
          }
        }),
        {
          headers: {
            "content-type": "application/json"
          },
          status: 200
        }
      )
    );
    signOutMock.mockResolvedValue({
      error: null
    });

    render(<UserMenu userEmail="abid@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST"
      })
    );
    await waitFor(() => expect(signOutMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/login"));
  });

  it("renders an inline error when logout fails", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "Unable to sign out right now."
        }),
        {
          headers: {
            "content-type": "application/json"
          },
          status: 500
        }
      )
    );

    render(<UserMenu userEmail="abid@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() =>
      expect(screen.getByText(/unable to sign out right now/i)).toBeInTheDocument()
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
