import { NextResponse, type NextRequest } from "next/server";
import { chatMessagePayloadSchema } from "@/lib/validations/chat";
import {
  getChatSession,
  persistAssistantReply,
  prepareChatTurn
} from "@/server/chat/persistence";
import { invokeChatAgent } from "@/server/agent/workflow";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { appEventLogger } from "@/server/logging/events";

export async function POST(request: NextRequest) {
  return withAuthenticatedApiRoute(async (auth) => {
    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const payload = chatMessagePayloadSchema.safeParse(requestBody);

    if (!payload.success) {
      return NextResponse.json(
        {
          error: "Invalid chat payload.",
          fieldErrors: payload.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const startedAt = Date.now();

    appEventLogger.info({
      event: "chat.request.started",
      metadata: {
        messageLength: payload.data.message.length,
        requestedSessionId: payload.data.sessionId ?? null
      },
      sessionId: payload.data.sessionId,
      userId: auth.userId
    });

    try {
      const existingSession = payload.data.sessionId
        ? await getChatSession(auth.supabase, {
            sessionId: payload.data.sessionId,
            userId: auth.userId
          })
        : null;

      if (payload.data.sessionId && !existingSession) {
        return NextResponse.json(
          { error: "Chat session not found." },
          { status: 404 }
        );
      }

      const preparedTurn = await prepareChatTurn({
        message: payload.data.message,
        sessionId: payload.data.sessionId,
        supabase: auth.supabase,
        userId: auth.userId
      });
      const agentResult = await invokeChatAgent({
        history:
          existingSession?.messages.map((message) => ({
            content: message.content,
            role: message.role
          })) ?? [],
        message: payload.data.message,
        sessionId: preparedTurn.sessionId,
        supabase: auth.supabase,
        userId: auth.userId
      });
      const session = await persistAssistantReply({
        assistant: {
          content: agentResult.content,
          langsmithRunId: agentResult.langsmithRunId,
          metadata: agentResult.metadata
        },
        sessionId: preparedTurn.sessionId,
        supabase: auth.supabase,
        userId: auth.userId
      });

      appEventLogger.info({
        durationMs: Date.now() - startedAt,
        event: "chat.request.completed",
        langsmithRunId: agentResult.langsmithRunId,
        metadata: {
          sourceCount: agentResult.metadata.sources?.length ?? 0,
          toolActivityCount: agentResult.metadata.toolActivity?.length ?? 0
        },
        sessionId: preparedTurn.sessionId,
        userId: auth.userId
      });

      return NextResponse.json({
        data: session,
        langsmithRunId: agentResult.langsmithRunId
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to complete the chat request.";

      appEventLogger.error({
        durationMs: Date.now() - startedAt,
        errorMessage: message,
        event: "chat.request.failed",
        metadata: {
          requestedSessionId: payload.data.sessionId ?? null
        },
        sessionId: payload.data.sessionId,
        userId: auth.userId
      });

      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
