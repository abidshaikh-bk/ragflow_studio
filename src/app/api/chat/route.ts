import { NextResponse, type NextRequest } from "next/server";
import type {
  ChatCitation,
  ChatReasoningStep
} from "@/components/chat/types";
import { chatMessagePayloadSchema } from "@/lib/validations/chat";
import { resolveChatModelSelection } from "@/server/chat/models";
import {
  getChatSession,
  persistAssistantReply,
  prepareChatTurn
} from "@/server/chat/persistence";
import { invokeChatAgent } from "@/server/agent/workflow";
import { getE2EAuthenticatedUser, getE2EStateId } from "@/server/auth/e2e";
import { createE2EChatReply } from "@/server/e2e/chat-store";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { parseJsonBody } from "@/server/http/validation";
import { appEventLogger } from "@/server/logging/events";

type ChatStreamMetadata = {
  langsmithRunId: string | null;
  metadata: {
    citations?: ChatCitation[];
    reasoning?: ChatReasoningStep[];
    toolActivity?: string[];
  };
  sessionId: string;
};

type ChatStreamReasoning = {
  step: ChatReasoningStep;
};

type ChatStreamComplete = {
  langsmithRunId: string | null;
  session: Awaited<ReturnType<typeof persistAssistantReply>>;
};

function wantsStreamingResponse(request: NextRequest) {
  return request.headers?.get?.("accept")?.includes("text/event-stream") ?? false;
}

function createSseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function chunkAssistantContent(content: string) {
  const normalized = content.trim();

  if (!normalized) {
    return [""];
  }

  const words = normalized.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const word of words) {
    const candidate = currentChunk ? `${currentChunk} ${word}` : word;

    if (candidate.length > 48 && currentChunk) {
      chunks.push(`${currentChunk} `);
      currentChunk = word;
      continue;
    }

    currentChunk = candidate;
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function createStreamingChatResponse(input: {
  agentResult: Awaited<ReturnType<typeof invokeChatAgent>>;
  onComplete: () => Promise<Awaited<ReturnType<typeof persistAssistantReply>>>;
  sessionId: string;
}) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        for (const step of input.agentResult.metadata.reasoning ?? []) {
          controller.enqueue(
            encoder.encode(
              createSseEvent("reasoning", {
                step
              } satisfies ChatStreamReasoning)
            )
          );
        }

        controller.enqueue(
          encoder.encode(
            createSseEvent("metadata", {
              langsmithRunId: input.agentResult.langsmithRunId,
              metadata: input.agentResult.metadata,
              sessionId: input.sessionId
            } satisfies ChatStreamMetadata)
          )
        );

        for (const chunk of chunkAssistantContent(input.agentResult.content)) {
          controller.enqueue(
            encoder.encode(
              createSseEvent("delta", {
                content: chunk
              })
            )
          );
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        const session = await input.onComplete();

        controller.enqueue(
          encoder.encode(
            createSseEvent("complete", {
              langsmithRunId: input.agentResult.langsmithRunId,
              session
            } satisfies ChatStreamComplete)
          )
        );
        controller.close();
      }
    }),
    {
      headers: {
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "content-type": "text/event-stream; charset=utf-8"
      }
    }
  );
}

export async function POST(request: NextRequest) {
  return withAuthenticatedApiRoute(async (auth) => {
    const payload = await parseJsonBody(
      request,
      chatMessagePayloadSchema,
      "Invalid chat payload."
    );

    if (payload.response) {
      return payload.response;
    }

    const startedAt = Date.now();
    const shouldStream = wantsStreamingResponse(request);

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
      if (await getE2EAuthenticatedUser()) {
        const session = createE2EChatReply({
          message: payload.data.message,
          modelConfigId: payload.data.modelConfigId ?? null,
          sessionId: payload.data.sessionId,
          stateId: (await getE2EStateId()) ?? "default",
          thinkingLevel: payload.data.thinkingLevel ?? "medium"
        });

        if (shouldStream) {
          const latestAssistantMessage = [...session.messages]
            .reverse()
            .find((message) => message.role === "assistant");

          if (!latestAssistantMessage) {
            throw new Error("The streamed E2E chat response did not include an assistant reply.");
          }

          return createStreamingChatResponse({
            agentResult: {
              content: latestAssistantMessage.content,
              langsmithRunId: null,
              metadata: latestAssistantMessage.metadata ?? {}
            },
            onComplete: async () => session,
            sessionId: session.id
          });
        }

        return NextResponse.json({
          data: session,
          langsmithRunId: null
        });
      }

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

      const resolvedSelection = await resolveChatModelSelection(auth.supabase, {
        modelConfigId:
          payload.data.modelConfigId === undefined
            ? existingSession?.modelConfigId ?? undefined
            : payload.data.modelConfigId,
        thinkingLevel: payload.data.thinkingLevel ?? existingSession?.thinkingLevel,
        userId: auth.userId
      });

      const preparedTurn = await prepareChatTurn({
        message: payload.data.message,
        modelConfigId: resolvedSelection.model.id,
        modelSnapshot: resolvedSelection.snapshot,
        sessionId: payload.data.sessionId,
        supabase: auth.supabase,
        thinkingLevel: resolvedSelection.thinkingLevel,
        userId: auth.userId
      });
      const agentResult = await invokeChatAgent({
        history:
          existingSession?.messages.map((message) => ({
            content: message.content,
            role: message.role
          })) ?? [],
        message: payload.data.message,
        requestedModel: resolvedSelection.model.modelName,
        requestedProvider: resolvedSelection.model.provider,
        sessionId: preparedTurn.sessionId,
        supabase: auth.supabase,
        thinkingLevel: resolvedSelection.thinkingLevel,
        userId: auth.userId
      });

      const finalizeSession = async () => {
        const session = await persistAssistantReply({
          assistant: {
            content: agentResult.content,
            langsmithRunId: agentResult.langsmithRunId,
            metadata: agentResult.metadata
          },
          modelConfigId: resolvedSelection.model.id,
          modelSnapshot: resolvedSelection.snapshot,
          sessionId: preparedTurn.sessionId,
          supabase: auth.supabase,
          thinkingLevel: resolvedSelection.thinkingLevel,
          userId: auth.userId
        });

        appEventLogger.info({
          durationMs: Date.now() - startedAt,
          event: "chat.request.completed",
          langsmithRunId: agentResult.langsmithRunId,
          metadata: {
            reasoningCount: agentResult.metadata.reasoning?.length ?? 0,
            sourceCount: agentResult.metadata.citations?.length ?? 0,
            toolActivityCount: agentResult.metadata.toolActivity?.length ?? 0
          },
          sessionId: preparedTurn.sessionId,
          userId: auth.userId
        });

        return session;
      };

      if (shouldStream) {
        return createStreamingChatResponse({
          agentResult,
          onComplete: finalizeSession,
          sessionId: preparedTurn.sessionId
        });
      }

      const session = await finalizeSession();

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
