import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/documents/[documentId]/access-link/route";

const createDocumentAccessLinkMock = vi.fn();
const getUserMock = vi.fn();
const supabaseMock = {
  auth: {
    getUser: getUserMock
  }
};

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: () => supabaseMock
}));

vi.mock("@/server/documents/detail", () => ({
  createDocumentAccessLink: (...args: unknown[]) => createDocumentAccessLinkMock(...args),
  getDocumentChunks: vi.fn(),
  getDocumentDetail: vi.fn(),
  getDocumentEmbeddings: vi.fn()
}));

describe("/api/documents/[documentId]/access-link route", () => {
  beforeEach(() => {
    createDocumentAccessLinkMock.mockReset();
    getUserMock.mockReset();
  });

  it("returns the authenticated user's presigned link", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    createDocumentAccessLinkMock.mockResolvedValue({
      expiresAt: "2026-06-25T10:05:00.000Z",
      expiresInSeconds: 300,
      url: "https://example.com/signed"
    });

    const response = await POST(
      new Request("http://localhost", {
        body: JSON.stringify({ action: "download" }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      }),
      {
        params: Promise.resolve({
          documentId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef"
        })
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(createDocumentAccessLinkMock).toHaveBeenCalledWith(supabaseMock, {
      action: "download",
      documentId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
      userId: "user-123"
    });
    expect(payload.data.url).toContain("signed");
  });

  it("returns 404 when the document does not belong to the user", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    createDocumentAccessLinkMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost", {
        body: JSON.stringify({ action: "view" }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      }),
      {
        params: Promise.resolve({
          documentId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef"
        })
      }
    );

    expect(response.status).toBe(404);
  });
});
