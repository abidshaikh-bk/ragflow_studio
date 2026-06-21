import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/chat/route";

const getUserMock = vi.fn();
const persistChatExchangeMock = vi.fn();
const buildMockAssistantReplyMock = vi.fn();
const supabaseMock = {
  auth: {
    getUser: getUserMock
  }
};

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: () => supabaseMock
}));

vi.mock("@/server/chat/persistence", () => ({
  buildMockAssistantReply: (...args: unknown[]) => buildMockAssistantReplyMock(...args),
  persistChatExchange: (...args: unknown[]) => persistChatExchangeMock(...args)
}));

describe("/api/chat route", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    persistChatExchangeMock.mockReset();
    buildMockAssistantReplyMock.mockReset();
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

  it("persists the user and assistant messages and returns the saved session", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });
    buildMockAssistantReplyMock.mockReturnValue({
      content: "Saved assistant reply",
      metadata: {
        sources: ["handbook.md chunk 1"],
        toolActivity: ["pinecone.query -> searched the authenticated user's namespace"]
      }
    });
    persistChatExchangeMock.mockResolvedValue({
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
    expect(buildMockAssistantReplyMock).toHaveBeenCalledWith("Summarize my documents");
    expect(persistChatExchangeMock).toHaveBeenCalledWith({
      assistant: {
        content: "Saved assistant reply",
        metadata: {
          sources: ["handbook.md chunk 1"],
          toolActivity: ["pinecone.query -> searched the authenticated user's namespace"]
        }
      },
      message: "Summarize my documents",
      sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
      supabase: supabaseMock,
      userId: "user-123"
    });
    expect(payload.data.id).toBe("session-1");
  });
});

function createJsonRequest(payload: unknown) {
  return {
    json: async () => payload
  } as NextRequest;
}
