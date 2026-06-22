import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/chat/route";

const getUserMock = vi.fn();
const getChatSessionMock = vi.fn();
const prepareChatTurnMock = vi.fn();
const persistAssistantReplyMock = vi.fn();
const invokeChatAgentMock = vi.fn();
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

vi.mock("@/server/chat/persistence", () => ({
  getChatSession: (...args: unknown[]) => getChatSessionMock(...args),
  persistAssistantReply: (...args: unknown[]) => persistAssistantReplyMock(...args),
  prepareChatTurn: (...args: unknown[]) => prepareChatTurnMock(...args)
}));

describe("/api/chat route", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getChatSessionMock.mockReset();
    prepareChatTurnMock.mockReset();
    persistAssistantReplyMock.mockReset();
    invokeChatAgentMock.mockReset();
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
        sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(prepareChatTurnMock).toHaveBeenCalledWith({
      message: "Summarize my documents",
      sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
      supabase: supabaseMock,
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
      sessionId: "session-1",
      supabase: supabaseMock,
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
      sessionId: "session-1",
      supabase: supabaseMock,
      userId: "user-123"
    });
    expect(payload.data.id).toBe("session-1");
    expect(payload.langsmithRunId).toBe("trace-123");
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
