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
    error: vi.fn(),
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

describe("/api/chat streaming route", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getChatSessionMock.mockReset();
    resolveChatModelSelectionMock.mockReset();
    prepareChatTurnMock.mockReset();
    persistAssistantReplyMock.mockReset();
    invokeChatAgentMock.mockReset();
    logInfoMock.mockReset();

    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });
    getChatSessionMock.mockResolvedValue({
      id: "session-1",
      messages: [],
      title: "New chat",
      updatedAt: "Jun 21, 10:05 PM"
    });
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
    prepareChatTurnMock.mockResolvedValue({
      messageId: "message-1",
      sessionId: "session-1"
    });
    invokeChatAgentMock.mockResolvedValue({
      content: "Streamed assistant answer for the chat UI.",
      langsmithRunId: "trace-stream-123",
      metadata: {
        sources: ["handbook.md chunk 1"],
        toolActivity: ["pinecone.query -> returned 1 document chunk"]
      }
    });
    persistAssistantReplyMock.mockResolvedValue({
      id: "session-1",
      messages: [],
      modelConfigId: defaultModelId,
      thinkingLevel: "high",
      title: "New chat",
      updatedAt: "Jun 21, 10:05 PM"
    });
  });

  it("returns incremental SSE events and persists after completion", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/chat", {
        body: JSON.stringify({
          message: "Summarize my documents",
          modelConfigId: defaultModelId,
          thinkingLevel: "high"
        }),
        headers: {
          accept: "text/event-stream",
          "content-type": "application/json"
        },
        method: "POST"
      })
    );

    expect(response.headers.get("content-type")).toContain("text/event-stream");

    const body = await response.text();

    expect(body).toContain("event: metadata");
    expect(body).toContain("event: delta");
    expect(body).toContain("event: complete");
    expect(body).toContain("Streamed assistant answer for the chat UI.");
    expect(persistAssistantReplyMock).toHaveBeenCalledTimes(1);
    expect(logInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "chat.request.completed",
        langsmithRunId: "trace-stream-123",
        sessionId: "session-1"
      })
    );
  });
});
