import { NextResponse, type NextRequest } from "next/server";
import { chatMessagePayloadSchema } from "@/lib/validations/chat";
import {
  buildMockAssistantReply,
  persistChatExchange
} from "@/server/chat/persistence";
import { createServerSupabaseClient } from "@/server/supabase/server";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();

  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = chatMessagePayloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      {
        error: "Invalid chat payload.",
        fieldErrors: payload.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const assistant = buildMockAssistantReply(payload.data.message);
  const session = await persistChatExchange({
    assistant,
    message: payload.data.message,
    sessionId: payload.data.sessionId,
    supabase: auth.supabase,
    userId: auth.userId
  });

  return NextResponse.json({ data: session });
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
