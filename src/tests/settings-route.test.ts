import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/settings/route";

const getUserMock = vi.fn();
const getUserSettingsMock = vi.fn();
const saveUserSettingsMock = vi.fn();
const supabaseMock = {
  auth: {
    getUser: getUserMock
  }
};

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: () => supabaseMock
}));

vi.mock("@/server/settings/service", () => ({
  getUserSettings: (...args: unknown[]) => getUserSettingsMock(...args),
  saveUserSettings: (...args: unknown[]) => saveUserSettingsMock(...args)
}));

describe("/api/settings route", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getUserSettingsMock.mockReset();
    saveUserSettingsMock.mockReset();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: null
      }
    });

    const getResponse = await GET();
    const postResponse = await POST(
      new NextRequest("http://localhost:3000/api/settings", {
        body: JSON.stringify({
          chatApiKey: "",
          chatModel: "gpt-4.1-mini",
          chatProvider: "openai",
          embeddingApiKey: "",
          embeddingDimensions: 1024,
          embeddingModel: "text-embedding-3-small",
          embeddingProvider: "openai"
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      })
    );

    expect(getResponse.status).toBe(401);
    expect(postResponse.status).toBe(401);
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
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

  it("returns masked saved settings for an authenticated user", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    getUserSettingsMock.mockResolvedValue({
      chatApiKeyMasked: "********1234",
      chatModel: "gpt-4.1-mini",
      chatProvider: "openai",
      embeddingApiKeyMasked: "********5678",
      embeddingDimensions: 1024,
      embeddingModel: "text-embedding-3-small",
      embeddingProvider: "openai"
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getUserSettingsMock).toHaveBeenCalledWith(supabaseMock, "user-123");
    expect(payload.data).toMatchObject({
      chatApiKeyMasked: "********1234",
      embeddingApiKeyMasked: "********5678"
    });
    expect(payload.data.chatApiKey).toBeUndefined();
    expect(payload.data.embeddingApiKey).toBeUndefined();
  });

  it("saves authenticated settings and never echoes raw API keys", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    saveUserSettingsMock.mockResolvedValue({
      chatApiKeyMasked: "********1234",
      chatModel: "claude-3-5-sonnet",
      chatProvider: "anthropic",
      embeddingApiKeyMasked: "********5678",
      embeddingDimensions: 1024,
      embeddingModel: "text-embedding-3-large",
      embeddingProvider: "openai"
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/settings", {
        body: JSON.stringify({
          chatApiKey: "raw-chat-secret",
          chatModel: "claude-3-5-sonnet",
          chatProvider: "anthropic",
          embeddingApiKey: "raw-embedding-secret",
          embeddingDimensions: 1024,
          embeddingModel: "text-embedding-3-large",
          embeddingProvider: "openai"
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(saveUserSettingsMock).toHaveBeenCalledWith(supabaseMock, "user-123", {
      chatApiKey: "raw-chat-secret",
      chatModel: "claude-3-5-sonnet",
      chatProvider: "anthropic",
      embeddingApiKey: "raw-embedding-secret",
      embeddingDimensions: 1024,
      embeddingModel: "text-embedding-3-large",
      embeddingProvider: "openai"
    });
    expect(payload.data).toMatchObject({
      chatApiKeyMasked: "********1234",
      embeddingApiKeyMasked: "********5678"
    });
    expect(payload.data.chatApiKey).toBeUndefined();
    expect(payload.data.embeddingApiKey).toBeUndefined();
  });

  it("ignores any client-supplied userId and saves settings for the authenticated user", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    saveUserSettingsMock.mockResolvedValue({
      chatApiKeyMasked: null,
      chatModel: "gpt-4.1-mini",
      chatProvider: "openai",
      embeddingApiKeyMasked: null,
      embeddingDimensions: 1024,
      embeddingModel: "text-embedding-3-small",
      embeddingProvider: "openai"
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/settings", {
        body: JSON.stringify({
          chatApiKey: "",
          chatModel: "gpt-4.1-mini",
          chatProvider: "openai",
          embeddingApiKey: "",
          embeddingDimensions: 1024,
          embeddingModel: "text-embedding-3-small",
          embeddingProvider: "openai",
          userId: "attacker-controlled-user"
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    expect(saveUserSettingsMock).toHaveBeenCalledWith(supabaseMock, "user-123", {
      chatApiKey: "",
      chatModel: "gpt-4.1-mini",
      chatProvider: "openai",
      embeddingApiKey: "",
      embeddingDimensions: 1024,
      embeddingModel: "text-embedding-3-small",
      embeddingProvider: "openai"
    });
  });

  it("returns a helpful 400 when a legacy saved key must be re-entered", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    saveUserSettingsMock.mockRejectedValue(
      new Error(
        "Your saved embedding gemini API key must be re-entered in Settings before it can be used."
      )
    );

    const response = await POST(
      new NextRequest("http://localhost:3000/api/settings", {
        body: JSON.stringify({
          chatApiKey: "",
          chatModel: "gemini-3.1-flash-lite",
          chatProvider: "gemini",
          embeddingApiKey: "",
          embeddingDimensions: 1024,
          embeddingModel: "gemini-embedding-2-preview",
          embeddingProvider: "gemini"
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error:
        "Your saved embedding gemini API key must be re-entered in Settings before it can be used."
    });
  });
});
