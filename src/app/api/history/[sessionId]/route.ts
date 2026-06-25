import { NextResponse } from "next/server";
import { parseChatSessionParams } from "@/lib/validations/chat";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { getHistoryRun } from "@/server/history/service";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  return withAuthenticatedApiRoute(async (auth) => {
    try {
      const { sessionId } = parseChatSessionParams(await context.params);
      const run = await getHistoryRun(auth.supabase, {
        sessionId,
        userId: auth.userId
      });

      if (!run) {
        return NextResponse.json({ error: "History session not found." }, { status: 404 });
      }

      return NextResponse.json({ data: run });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load the history session.";
      const status = message.includes("Invalid chat session id") ? 400 : 500;

      return NextResponse.json({ error: message }, { status });
    }
  });
}
