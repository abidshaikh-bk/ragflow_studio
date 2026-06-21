import { NextResponse } from "next/server";
import { getChatSession } from "@/server/chat/persistence";
import { createServerSupabaseClient } from "@/server/supabase/server";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await authenticateRequest();

  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await context.params;

  try {
    const session = await getChatSession(auth.supabase, {
      sessionId,
      userId: auth.userId
    });

    if (!session) {
      return NextResponse.json({ error: "Chat session not found." }, { status: 404 });
    }

    return NextResponse.json({ data: session });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load the chat session.";
    const status =
      message.includes("Invalid chat session id") || message.includes("not found")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
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
