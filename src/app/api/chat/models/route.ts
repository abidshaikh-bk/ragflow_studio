import { NextResponse } from "next/server";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { listChatModelPreferences } from "@/server/chat/models";

export async function GET() {
  return withAuthenticatedApiRoute(async (auth) => {
    const preferences = await listChatModelPreferences(auth.supabase, auth.userId);

    return NextResponse.json({ data: preferences });
  });
}
