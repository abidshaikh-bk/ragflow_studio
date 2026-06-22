import { NextResponse } from "next/server";
import { E2E_AUTH_COOKIE_NAME, isE2EAuthBypassEnabled } from "@/server/auth/e2e";

export async function POST() {
  if (!isE2EAuthBypassEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const response = NextResponse.json({
    data: {
      redirectTo: "/chat"
    }
  });

  response.cookies.set(E2E_AUTH_COOKIE_NAME, "authenticated", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: false
  });

  return response;
}
