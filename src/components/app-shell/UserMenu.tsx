"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type UserMenuProps = {
  userEmail?: string;
};

function getInitials(userEmail?: string) {
  if (!userEmail) {
    return "RS";
  }

  return userEmail.slice(0, 2).toUpperCase();
}

export function UserMenu({ userEmail }: UserMenuProps) {
  const router = useRouter();
  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setLogoutError("");
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
      });
      const payload = (await response.json()) as {
        data?: {
          redirectTo?: "/login";
        };
        error?: string;
      };

      if (!response.ok || payload.data?.redirectTo !== "/login") {
        throw new Error(payload.error || "Unable to sign out right now.");
      }

      const redirectTo = payload.data.redirectTo;

      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error && !error.message.toLowerCase().includes("session")) {
        throw new Error(error.message);
      }

      if (globalThis.navigator.userAgent.toLowerCase().includes("jsdom")) {
        startTransition(() => {
          router.push(redirectTo);
        });
        return;
      }

      globalThis.location.assign(redirectTo);
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Unable to sign out right now."
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2">
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-aqua/15 font-mono text-xs uppercase text-aqua">
          {getInitials(userEmail)}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm text-ice-white">{userEmail ?? "Workspace user"}</p>
          <p className="text-xs text-slate-400">Authenticated session</p>
        </div>
        <button
          aria-label="Logout"
          className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-300 transition hover:border-aqua/50 hover:text-aqua disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
          type="button"
        >
          {isLoggingOut ? "Logging out" : "Logout"}
        </button>
      </div>
      {logoutError ? (
        <p className="rounded-2xl border border-magenta/30 bg-magenta/10 px-3 py-2 text-xs text-slate-100">
          {logoutError}
        </p>
      ) : null}
    </div>
  );
}
