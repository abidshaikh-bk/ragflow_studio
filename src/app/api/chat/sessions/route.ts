import { NextResponse } from "next/server";
import { listChatSessions } from "@/server/chat/persistence";
import { createServerSupabaseClient } from "@/server/supabase/server";

export async function GET() {
  const auth = await authenticateRequest();

  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await listChatSessions(auth.supabase, auth.userId);

  return NextResponse.json({ data: sessions });
}

async function authenticateRequest() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return {
    supabase,
    userId: user?.id ?? null
  };
}
