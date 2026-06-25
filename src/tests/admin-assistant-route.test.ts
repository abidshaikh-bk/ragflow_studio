import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT } from "@/app/api/admin/assistant/route";

const getUserMock = vi.fn();
const maybeSingleMock = vi.fn();
const selectMock = vi.fn(() => ({
  eq: vi.fn(() => ({
    maybeSingle: maybeSingleMock
  }))
}));
const fromMock = vi.fn(() => ({
  select: selectMock
}));
const getSharedAssistantSettingsMock = vi.fn();
const saveSharedAssistantSettingsMock = vi.fn();
const supabaseMock = {
  auth: {
    getUser: getUserMock
  },
  from: fromMock
};

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: () => supabaseMock
}));

vi.mock("@/server/admin/settings", () => ({
  getSharedAssistantSettings: (...args: unknown[]) => getSharedAssistantSettingsMock(...args),
  saveSharedAssistantSettings: (...args: unknown[]) => saveSharedAssistantSettingsMock(...args)
}));

describe("/api/admin/assistant route", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    maybeSingleMock.mockReset();
    getSharedAssistantSettingsMock.mockReset();
    saveSharedAssistantSettingsMock.mockReset();
    fromMock.mockClear();
    selectMock.mockClear();
  });

  it("returns 403 for authenticated non-admin users", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          app_metadata: {},
          id: "user-123",
          user_metadata: {}
        }
      }
    });
    maybeSingleMock.mockResolvedValue({
      data: {
        is_admin: false
      },
      error: null
    });

    const getResponse = await GET();
    const putResponse = await PUT(
      new NextRequest("http://localhost:3000/api/admin/assistant", {
        body: JSON.stringify({
          systemPrompt: "Stay concise.",
          toolPolicy: {
            enableDateTime: true,
            enableVectorSearch: true,
            enableWebSearch: false
          }
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "PUT"
      })
    );

    expect(getResponse.status).toBe(403);
    expect(putResponse.status).toBe(403);
  });

  it("loads the shared assistant settings for admins", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          app_metadata: {},
          id: "admin-123",
          user_metadata: {}
        }
      }
    });
    maybeSingleMock.mockResolvedValue({
      data: {
        is_admin: true
      },
      error: null
    });
    getSharedAssistantSettingsMock.mockResolvedValue({
      systemPrompt: "Answer with clear bullet points.",
      toolPolicy: {
        enableDateTime: true,
        enableVectorSearch: true,
        enableWebSearch: false
      },
      updatedAt: "2026-06-25T10:00:00.000Z"
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getSharedAssistantSettingsMock).toHaveBeenCalledWith(supabaseMock);
    expect(payload.data.toolPolicy.enableWebSearch).toBe(false);
  });

  it("saves the shared assistant settings for admins", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          app_metadata: {},
          id: "admin-123",
          user_metadata: {}
        }
      }
    });
    maybeSingleMock.mockResolvedValue({
      data: {
        is_admin: true
      },
      error: null
    });
    saveSharedAssistantSettingsMock.mockResolvedValue({
      systemPrompt: "Use concise release-note formatting.",
      toolPolicy: {
        enableDateTime: false,
        enableVectorSearch: true,
        enableWebSearch: true
      },
      updatedAt: "2026-06-25T10:15:00.000Z"
    });

    const response = await PUT(
      new NextRequest("http://localhost:3000/api/admin/assistant", {
        body: JSON.stringify({
          systemPrompt: "Use concise release-note formatting.",
          toolPolicy: {
            enableDateTime: false,
            enableVectorSearch: true,
            enableWebSearch: true
          }
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "PUT"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(saveSharedAssistantSettingsMock).toHaveBeenCalledWith(
      supabaseMock,
      "admin-123",
      {
        systemPrompt: "Use concise release-note formatting.",
        toolPolicy: {
          enableDateTime: false,
          enableVectorSearch: true,
          enableWebSearch: true
        }
      }
    );
    expect(payload.data.updatedAt).toBe("2026-06-25T10:15:00.000Z");
  });
});
