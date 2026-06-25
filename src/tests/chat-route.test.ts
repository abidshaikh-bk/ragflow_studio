import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/chat/route";

const defaultModelId = "11111111-1111-4111-8111-111111111111";

const getUserMock = vi.fn();
const getChatSessionMock = vi.fn();
const resolveChatModelSelectionMock = vi.fn();
const prepareChatTurnMock = vi.fn();
const persistAssistantReplyMock = vi.fn();
const invokeChatAgentMock = vi.fn();
const logInfoMock = vi.fn();
const logErrorMock = vi.fn();
const supabaseMock = {
  auth: {
    getUser: getUserMock
  }
};

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: () => supabaseMock
}));

vi.mock("@/server/agent/workflow", () => ({
  invokeChatAgent: (...args: unknown[]) => invokeChatAgentMock(...args)
}));

vi.mock("@/server/logging/events", () => ({
  appEventLogger: {
    error: (...args: unknown[]) => logErrorMock(...args),
    info: (...args: unknown[]) => logInfoMock(...args)
  }
}));

vi.mock("@/server/chat/persistence", () => ({
  getChatSession: (...args: unknown[]) => getChatSessionMock(...args),
  persistAssistantReply: (...args: unknown[]) => persistAssistantReplyMock(...args),
  prepareChatTurn: (...args: unknown[]) => prepareChatTurnMock(...args)
}));

vi.mock("@/server/chat/models", () => ({
  resolveChatModelSelection: (...args: unknown[]) =>
    resolveChatModelSelectionMock(...args)
}));

describe("/api/chat route", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getChatSessionMock.mockReset();
    prepareChatTurnMock.mockReset();
    persistAssistantReplyMock.mockReset();
    invokeChatAgentMock.mockReset();
    resolveChatModelSelectionMock.mockReset();
    logInfoMock.mockReset();
    logErrorMock.mockReset();

    resolveChatModelSelectionMock.mockResolvedValue({
      model: {
        defaultThinkingLevel: "medium",
        id: defaultModelId,
        isDefault: true,
        label: "Default chat model",
        modelName: "gpt-4.1-mini",
        provider: "openai",
        supportsThinking: true
      },
      snapshot: {
        label: "Default chat model",
        modelName: "gpt-4.1-mini",
        provider: "openai"
      },
      thinkingLevel: "high"
    });
  });

  it("returns 401 when the request is unauthenticated", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: null
      }
    });

    const response = await POST(createJsonRequest({ message: "Hello" }));

    expect(response.status).toBe(401);
  });

  it("returns 400 for an empty message", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });

    const response = await POST(createJsonRequest({ message: "   " }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/invalid chat payload/i);
  });

  it("returns 404 when the session does not belong to the authenticated user", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });
    getChatSessionMock.mockResolvedValue(null);

    const response = await POST(
      createJsonRequest({
        message: "Summarize my documents",
        sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef"
      })
    );

    expect(response.status).toBe(404);
    expect(prepareChatTurnMock).not.toHaveBeenCalled();
  });

  it("persists the user message, invokes the agent, and returns the saved session", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });
    getChatSessionMock.mockResolvedValue({
      id: "session-1",
      messages: [
        {
          content: "What is our document policy?",
          id: "message-0",
          role: "user"
        }
      ],
      modelConfigId: defaultModelId,
      thinkingLevel: "medium",
      title: "What is our document policy?",
      updatedAt: "Jun 21, 10:05 PM"
    });
    prepareChatTurnMock.mockResolvedValue({
      messageId: "message-1",
      sessionId: "session-1"
    });
    invokeChatAgentMock.mockResolvedValue({
      content: "Saved assistant reply",
      langsmithRunId: "trace-123",
      metadata: {
        sources: ["handbook.md chunk 1"],
        toolActivity: ["pinecone.query -> searched the authenticated user's namespace"]
      }
    });
    persistAssistantReplyMock.mockResolvedValue({
      id: "session-1",
      messages: [
        {
          content: "Summarize my documents",
          id: "message-1",
          role: "user"
        },
        {
          content: "Saved assistant reply",
          id: "message-2",
          metadata: {
            langsmithRunId: "trace-123",
            sources: ["handbook.md chunk 1"],
            toolActivity: ["pinecone.query -> searched the authenticated user's namespace"]
          },
          role: "assistant"
        }
      ],
      title: "Summarize my documents",
      updatedAt: "Jun 21, 10:05 PM"
    });

    const response = await POST(
      createJsonRequest({
        message: "Summarize my documents",
        modelConfigId: defaultModelId,
        sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
        thinkingLevel: "high"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(resolveChatModelSelectionMock).toHaveBeenCalledWith(supabaseMock, {
      modelConfigId: defaultModelId,
      thinkingLevel: "high",
      userId: "user-123"
    });
    expect(prepareChatTurnMock).toHaveBeenCalledWith({
      message: "Summarize my documents",
      modelConfigId: defaultModelId,
      modelSnapshot: {
        label: "Default chat model",
        modelName: "gpt-4.1-mini",
        provider: "openai"
      },
      sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
      supabase: supabaseMock,
      thinkingLevel: "high",
      userId: "user-123"
    });
    expect(invokeChatAgentMock).toHaveBeenCalledWith({
      history: [
        {
          content: "What is our document policy?",
          role: "user"
        }
      ],
      message: "Summarize my documents",
      requestedModel: "gpt-4.1-mini",
      requestedProvider: "openai",
      sessionId: "session-1",
      supabase: supabaseMock,
      thinkingLevel: "high",
      userId: "user-123"
    });
    expect(persistAssistantReplyMock).toHaveBeenCalledWith({
      assistant: {
        content: "Saved assistant reply",
        langsmithRunId: "trace-123",
        metadata: {
          sources: ["handbook.md chunk 1"],
          toolActivity: ["pinecone.query -> searched the authenticated user's namespace"]
        }
      },
      modelConfigId: defaultModelId,
      modelSnapshot: {
        label: "Default chat model",
        modelName: "gpt-4.1-mini",
        provider: "openai"
      },
      sessionId: "session-1",
      supabase: supabaseMock,
      thinkingLevel: "high",
      userId: "user-123"
    });
    expect(payload.data.id).toBe("session-1");
    expect(payload.langsmithRunId).toBe("trace-123");
    expect(logInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "chat.request.started",
        metadata: expect.objectContaining({
          messageLength: "Summarize my documents".length
        }),
        userId: "user-123"
      })
    );
    expect(logInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "chat.request.completed",
        langsmithRunId: "trace-123",
        sessionId: "session-1",
        userId: "user-123"
      })
    );
  });

  it("ignores any client-supplied userId and uses the authenticated user for chat persistence", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });
    prepareChatTurnMock.mockResolvedValue({
      messageId: "message-1",
      sessionId: "session-1"
    });
    invokeChatAgentMock.mockResolvedValue({
      content: "Saved assistant reply",
      langsmithRunId: null,
      metadata: {
        sources: [],
        toolActivity: []
      }
    });
    persistAssistantReplyMock.mockResolvedValue({
      id: "session-1",
      messages: [],
      title: "Summarize my documents",
      updatedAt: "Jun 21, 10:05 PM"
    });

    const response = await POST(
      createJsonRequest({
        message: "Summarize my documents",
        modelConfigId: defaultModelId,
        thinkingLevel: "high",
        userId: "attacker-controlled-user"
      })
    );

    expect(response.status).toBe(200);
    expect(prepareChatTurnMock).toHaveBeenCalledWith({
      message: "Summarize my documents",
      modelConfigId: defaultModelId,
      modelSnapshot: {
        label: "Default chat model",
        modelName: "gpt-4.1-mini",
        provider: "openai"
      },
      sessionId: undefined,
      supabase: supabaseMock,
      thinkingLevel: "high",
      userId: "user-123"
    });
    expect(invokeChatAgentMock).toHaveBeenCalledWith({
      history: [],
      message: "Summarize my documents",
      requestedModel: "gpt-4.1-mini",
      requestedProvider: "openai",
      sessionId: "session-1",
      supabase: supabaseMock,
      thinkingLevel: "high",
      userId: "user-123"
    });
    expect(persistAssistantReplyMock).toHaveBeenCalledWith({
      assistant: {
        content: "Saved assistant reply",
        langsmithRunId: null,
        metadata: {
          sources: [],
          toolActivity: []
        }
      },
      modelConfigId: defaultModelId,
      modelSnapshot: {
        label: "Default chat model",
        modelName: "gpt-4.1-mini",
        provider: "openai"
      },
      sessionId: "session-1",
      supabase: supabaseMock,
      thinkingLevel: "high",
      userId: "user-123"
    });
  });

  it("returns a JSON 500 response when the agent fails", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });
    prepareChatTurnMock.mockResolvedValue({
      messageId: "message-1",
      sessionId: "session-1"
    });
    invokeChatAgentMock.mockRejectedValue(
      new Error('Unsupported chat provider "gemini" for the MVP chat agent.')
    );

    const response = await POST(
      createJsonRequest({
        message: "Summarize my documents"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: 'Unsupported chat provider "gemini" for the MVP chat agent.'
    });
    expect(logErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: 'Unsupported chat provider "gemini" for the MVP chat agent.',
        event: "chat.request.failed",
        userId: "user-123"
      })
    );
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });

    const response = await POST({
      json: async () => {
        throw new Error("Unexpected end of JSON input");
      }
    } as unknown as NextRequest);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error: "Invalid JSON request body."
    });
  });
});

function createJsonRequest(payload: unknown) {
  return {
    json: async () => payload
  } as NextRequest;
}
