import { NextResponse } from "next/server";
import { E2E_AUTH_COOKIE_NAME, isE2EAuthBypassEnabled } from "@/server/auth/e2e";
import { createServerSupabaseClient } from "@/server/supabase/server";

function buildLogoutResponse() {
  const response = NextResponse.json({
    data: {
      redirectTo: "/login"
    }
  });

  if (isE2EAuthBypassEnabled()) {
    response.cookies.set(E2E_AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: false
    });
  }

  return response;
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error && !error.message.toLowerCase().includes("session")) {
    return NextResponse.json(
      {
        error: "Unable to sign out right now."
      },
      { status: 500 }
    );
  }

  return buildLogoutResponse();
}
