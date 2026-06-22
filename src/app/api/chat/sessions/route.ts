import { NextResponse } from "next/server";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { listChatSessions } from "@/server/chat/persistence";

export async function GET() {
  return withAuthenticatedApiRoute(async (auth) => {
    const sessions = await listChatSessions(auth.supabase, auth.userId);

    return NextResponse.json({ data: sessions });
  });
}
