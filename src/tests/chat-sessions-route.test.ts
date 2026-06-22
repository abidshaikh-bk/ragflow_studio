import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getSession } from "@/app/api/chat/sessions/[sessionId]/route";
import { GET as listSessions } from "@/app/api/chat/sessions/route";

const getUserMock = vi.fn();
const getChatSessionMock = vi.fn();
const listChatSessionsMock = vi.fn();
const supabaseMock = {
  auth: {
    getUser: getUserMock
  }
};

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: () => supabaseMock
}));

vi.mock("@/server/chat/persistence", () => ({
  getChatSession: (...args: unknown[]) => getChatSessionMock(...args),
  listChatSessions: (...args: unknown[]) => listChatSessionsMock(...args)
}));

describe("chat session routes", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getChatSessionMock.mockReset();
    listChatSessionsMock.mockReset();
  });

  it("returns 401 for unauthenticated session list requests", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: null
      }
    });

    const response = await listSessions();

    expect(response.status).toBe(401);
  });

  it("returns the authenticated user's chat sessions", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });
    listChatSessionsMock.mockResolvedValue([
      {
        id: "session-1",
        messages: [],
        title: "Upload policy Q&A",
        updatedAt: "Jun 21, 10:05 PM"
      }
    ]);

    const response = await listSessions();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(listChatSessionsMock).toHaveBeenCalledWith(supabaseMock, "user-123");
    expect(payload.data).toHaveLength(1);
  });

  it("returns the authenticated user's saved session messages", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });
    getChatSessionMock.mockResolvedValue({
      id: "session-1",
      messages: [
        {
          content: "Summarize my documents",
          id: "message-1",
          role: "user"
        }
      ],
      title: "Upload policy Q&A",
      updatedAt: "Jun 21, 10:05 PM"
    });

    const response = await getSession(new Request("http://localhost"), {
      params: Promise.resolve({
        sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef"
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getChatSessionMock).toHaveBeenCalledWith(supabaseMock, {
      sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
      userId: "user-123"
    });
    expect(payload.data.id).toBe("session-1");
  });

  it("returns 400 when the session id is not a valid uuid", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });
    getChatSessionMock.mockRejectedValue(new Error("Invalid chat session id."));

    const response = await getSession(new Request("http://localhost"), {
      params: Promise.resolve({
        sessionId: "not-a-uuid"
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error: "Invalid chat session id."
    });
    expect(getChatSessionMock).not.toHaveBeenCalled();
  });
});
