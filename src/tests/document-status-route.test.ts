import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/documents/[documentId]/status/route";

const getUserMock = vi.fn();
const getDocumentStatusMock = vi.fn();
const supabaseMock = {
  auth: {
    getUser: getUserMock
  }
};

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: () => supabaseMock
}));

vi.mock("@/server/documents/status", () => ({
  getDocumentStatus: (...args: unknown[]) => getDocumentStatusMock(...args)
}));

describe("/api/documents/[documentId]/status route", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getDocumentStatusMock.mockReset();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: null
      }
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({
        documentId: "489fe5c8-d276-4c84-b59f-b914bd7f14f4"
      })
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when the document is not found for the authenticated user", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    getDocumentStatusMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({
        documentId: "489fe5c8-d276-4c84-b59f-b914bd7f14f4"
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error).toMatch(/document not found/i);
  });

  it("returns 400 when the document id is not a valid uuid", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({
        documentId: "not-a-uuid"
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error: "Invalid document id."
    });
    expect(getDocumentStatusMock).not.toHaveBeenCalled();
  });

  it("returns the current status snapshot for the authenticated user's document", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    getDocumentStatusMock.mockResolvedValue({
      documentId: "489fe5c8-d276-4c84-b59f-b914bd7f14f4",
      fileName: "handbook.md",
      processedChunks: 12,
      status: "embedding",
      totalChunks: 24
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({
        documentId: "489fe5c8-d276-4c84-b59f-b914bd7f14f4"
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getDocumentStatusMock).toHaveBeenCalledWith(supabaseMock, {
      documentId: "489fe5c8-d276-4c84-b59f-b914bd7f14f4",
      userId: "user-123"
    });
    expect(payload).toEqual({
      data: {
        documentId: "489fe5c8-d276-4c84-b59f-b914bd7f14f4",
        fileName: "handbook.md",
        processedChunks: 12,
        status: "embedding",
        totalChunks: 24
      }
    });
  });
});
