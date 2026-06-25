import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getDocumentChunks } from "@/app/api/documents/[documentId]/chunks/route";
import { GET as getDocumentDetail } from "@/app/api/documents/[documentId]/route";
import { GET as getDocumentEmbeddings } from "@/app/api/documents/[documentId]/embeddings/route";

const getUserMock = vi.fn();
const getDocumentChunksMock = vi.fn();
const getDocumentDetailMock = vi.fn();
const getDocumentEmbeddingsMock = vi.fn();
const supabaseMock = {
  auth: {
    getUser: getUserMock
  }
};

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: () => supabaseMock
}));

vi.mock("@/server/documents/detail", () => ({
  createDocumentAccessLink: vi.fn(),
  getDocumentChunks: (...args: unknown[]) => getDocumentChunksMock(...args),
  getDocumentDetail: (...args: unknown[]) => getDocumentDetailMock(...args),
  getDocumentEmbeddings: (...args: unknown[]) => getDocumentEmbeddingsMock(...args)
}));

describe("document explorer routes", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    getDocumentChunksMock.mockReset();
    getDocumentDetailMock.mockReset();
    getDocumentEmbeddingsMock.mockReset();
  });

  it("returns the authenticated user's document detail", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    getDocumentDetailMock.mockResolvedValue({
      documentId: "doc-123",
      fileName: "handbook.md",
      status: "completed"
    });

    const response = await getDocumentDetail(new Request("http://localhost"), {
      params: Promise.resolve({
        documentId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef"
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getDocumentDetailMock).toHaveBeenCalledWith(supabaseMock, {
      documentId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
      userId: "user-123"
    });
    expect(payload.data.fileName).toBe("handbook.md");
  });

  it("returns 404 when the document detail is missing", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    getDocumentDetailMock.mockResolvedValue(null);

    const response = await getDocumentDetail(new Request("http://localhost"), {
      params: Promise.resolve({
        documentId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef"
      })
    });

    expect(response.status).toBe(404);
  });

  it("returns 400 for invalid document ids", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });

    const response = await getDocumentDetail(new Request("http://localhost"), {
      params: Promise.resolve({
        documentId: "not-a-uuid"
      })
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error: "Invalid document id."
    });
    expect(getDocumentDetailMock).not.toHaveBeenCalled();
  });

  it("returns the authenticated user's chunks and embedding summaries", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-123"
        }
      }
    });
    getDocumentChunksMock.mockResolvedValue([
      {
        chunkIndex: 0,
        contentPreview: "Policies require approval.",
        id: "chunk-1",
        pineconeVectorId: "user-123:doc-123:0",
        tokenCount: 4
      }
    ]);
    getDocumentEmbeddingsMock.mockResolvedValue({
      documentId: "doc-123",
      namespace: "user:user-123",
      vectorCount: 1,
      vectors: []
    });

    const chunkResponse = await getDocumentChunks(new Request("http://localhost"), {
      params: Promise.resolve({
        documentId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef"
      })
    });
    const embeddingResponse = await getDocumentEmbeddings(new Request("http://localhost"), {
      params: Promise.resolve({
        documentId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef"
      })
    });

    expect(chunkResponse.status).toBe(200);
    expect(embeddingResponse.status).toBe(200);
  });
});
