import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/chat/models/route";

const getUserMock = vi.fn();
const listChatModelPreferencesMock = vi.fn();
const supabaseMock = {
  auth: {
    getUser: getUserMock
  }
};

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: () => supabaseMock
}));

vi.mock("@/server/chat/models", () => ({
  listChatModelPreferences: (...args: unknown[]) =>
    listChatModelPreferencesMock(...args)
}));

describe("/api/chat/models route", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    listChatModelPreferencesMock.mockReset();
  });

  it("returns 401 for unauthenticated requests", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: null
      }
    });

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns the authenticated user's chat model preferences", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-123" }
      }
    });
    listChatModelPreferencesMock.mockResolvedValue({
      defaultModelConfigId: "model-1",
      defaultThinkingLevel: "medium",
      models: [
        {
          defaultThinkingLevel: "medium",
          id: "model-1",
          isDefault: true,
          label: "Default chat model",
          modelName: "gpt-4.1-mini",
          provider: "openai",
          supportsThinking: true
        }
      ]
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(listChatModelPreferencesMock).toHaveBeenCalledWith(
      supabaseMock,
      "user-123"
    );
    expect(payload.data.models).toHaveLength(1);
    expect(payload.data.defaultThinkingLevel).toBe("medium");
  });
});
