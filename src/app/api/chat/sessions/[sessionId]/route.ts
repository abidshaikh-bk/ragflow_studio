import { NextResponse } from "next/server";
import { parseChatSessionParams } from "@/lib/validations/chat";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { getChatSession } from "@/server/chat/persistence";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  return withAuthenticatedApiRoute(async (auth) => {
    try {
      const { sessionId } = parseChatSessionParams(await context.params);
      const session = await getChatSession(auth.supabase, {
        sessionId,
        userId: auth.userId
      });

      if (!session) {
        return NextResponse.json(
          { error: "Chat session not found." },
          { status: 404 }
        );
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
  });
}
