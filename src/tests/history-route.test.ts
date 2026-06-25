import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getHistoryRun } from "@/app/api/history/[sessionId]/route";
import { GET as listHistoryRuns } from "@/app/api/history/route";

const getUserMock = vi.fn();
const getHistoryRunMock = vi.fn();
const listHistoryRunsMock = vi.fn();
const supabaseMock = {
  auth: {
    getUser: getUserMock
  }
};

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: () => supabaseMock
}));

vi.mock("@/server/history/service", () => ({
  getHistoryRun: (...args: unknown[]) => getHistoryRunMock(...args),
  listHistoryRuns: (...args: unknown[]) => listHistoryRunsMock(...args)
}));

describe("history routes", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getHistoryRunMock.mockReset();
    listHistoryRunsMock.mockReset();
  });

  it("returns 401 for unauthenticated history list requests", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: null
      }
    });

    const response = await listHistoryRuns();

    expect(response.status).toBe(401);
  });

  it("returns the authenticated user's history summaries", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });
    listHistoryRunsMock.mockResolvedValue([
      {
        assistantReply: "Based on your docs, refunds require manager approval.",
        hasRuntimeMcpActivity: false,
        sessionId: "session-1",
        status: "completed",
        title: "Policy Q&A",
        toolActivityCount: 1,
        toolNames: ["pinecone.query"],
        trace: {
          deepLink: null,
          runId: "trace-123",
          source: "assistant_message"
        },
        updatedAt: "2026-06-25T07:00:00.000Z",
        userPrompt: "What does the refund policy say?"
      }
    ]);

    const response = await listHistoryRuns();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(listHistoryRunsMock).toHaveBeenCalledWith(supabaseMock, "user-123");
    expect(payload.data).toHaveLength(1);
  });

  it("returns the authenticated user's history detail", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });
    getHistoryRunMock.mockResolvedValue({
      assistantReply: "Refunds require manager approval.",
      hasRuntimeMcpActivity: true,
      messages: [],
      sessionId: "session-1",
      status: "completed",
      title: "Policy Q&A",
      toolActivity: [],
      toolActivityCount: 2,
      toolNames: ["pinecone.query", "weather_lookup"],
      trace: {
        deepLink: null,
        runId: "trace-456",
        source: "runtime_mcp_tool"
      },
      updatedAt: "2026-06-25T07:00:00.000Z",
      userPrompt: "What does the refund policy say?"
    });

    const response = await getHistoryRun(new Request("http://localhost"), {
      params: Promise.resolve({
        sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef"
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getHistoryRunMock).toHaveBeenCalledWith(supabaseMock, {
      sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
      userId: "user-123"
    });
    expect(payload.data.trace.runId).toBe("trace-456");
  });

  it("returns 404 when the history session is missing", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });
    getHistoryRunMock.mockResolvedValue(null);

    const response = await getHistoryRun(new Request("http://localhost"), {
      params: Promise.resolve({
        sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef"
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({
      error: "History session not found."
    });
  });

  it("returns 400 when the history session id is invalid", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });

    const response = await getHistoryRun(new Request("http://localhost"), {
      params: Promise.resolve({
        sessionId: "not-a-uuid"
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error: "Invalid chat session id."
    });
    expect(getHistoryRunMock).not.toHaveBeenCalled();
  });
});
