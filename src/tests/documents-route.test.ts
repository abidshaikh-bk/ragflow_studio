import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/documents/route";

const getUserMock = vi.fn();
const listUserDocumentsMock = vi.fn();
const supabaseMock = {
  auth: {
    getUser: getUserMock
  }
};

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: () => supabaseMock
}));

vi.mock("@/server/documents/list", () => ({
  listUserDocuments: (...args: unknown[]) => listUserDocumentsMock(...args)
}));

describe("/api/documents route", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    listUserDocumentsMock.mockReset();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: null
      }
    });

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns the authenticated user's documents", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    listUserDocumentsMock.mockResolvedValue([
      {
        documentId: "doc-123",
        fileName: "handbook.md",
        processedChunks: 24,
        status: "completed",
        totalChunks: 24,
        updatedAt: "2026-06-22T10:00:00.000Z"
      }
    ]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(listUserDocumentsMock).toHaveBeenCalledWith(supabaseMock, "user-123");
    expect(payload).toEqual({
      data: [
        {
          documentId: "doc-123",
          fileName: "handbook.md",
          processedChunks: 24,
          status: "completed",
          totalChunks: 24,
          updatedAt: "2026-06-22T10:00:00.000Z"
        }
      ]
    });
  });
});
