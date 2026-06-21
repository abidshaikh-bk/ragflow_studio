import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildPineconeVectors,
  indexDocumentEmbeddings
} from "@/server/pinecone/indexing";

const upsertMock = vi.fn();
const eqUserMock = vi.fn();
const eqIdMock = vi.fn(() => ({
  eq: eqUserMock
}));
const updateMock = vi.fn(() => ({
  eq: eqIdMock
}));
const fromMock = vi.fn(() => ({
  update: updateMock
}));

const supabaseMock = {
  from: fromMock
};

const chunks = [
  {
    chunkIndex: 0,
    contentPreview: "approval flow chunk",
    pineconeVectorId: "user-123:doc-123:0"
  },
  {
    chunkIndex: 1,
    contentPreview: "security policy chunk",
    pineconeVectorId: "user-123:doc-123:1"
  }
];

const vectors = [
  { chunkIndex: 0, values: [0.1, 0.2] },
  { chunkIndex: 1, values: [0.3, 0.4] }
];

describe("pinecone indexing", () => {
  beforeEach(() => {
    upsertMock.mockReset();
    fromMock.mockClear();
    updateMock.mockClear();
    eqIdMock.mockClear();
    eqUserMock.mockReset();
  });

  it("builds vectors with the expected metadata", () => {
    const pineconeVectors = buildPineconeVectors({
      chunks,
      documentId: "doc-123",
      fileName: "handbook.md",
      userId: "user-123",
      vectors
    });

    expect(pineconeVectors[0]).toEqual({
      id: "user-123:doc-123:0",
      metadata: {
        chunkIndex: 0,
        contentPreview: "approval flow chunk",
        documentId: "doc-123",
        fileName: "handbook.md",
        userId: "user-123"
      },
      values: [0.1, 0.2]
    });
  });

  it("sends the upsert payload to the user namespace and marks the document completed", async () => {
    eqUserMock.mockResolvedValue({ error: null });

    const result = await indexDocumentEmbeddings(
      {
        chunks,
        documentId: "doc-123",
        fileName: "handbook.md",
        supabase: supabaseMock as never,
        userId: "user-123",
        vectors
      },
      {
        upsert: upsertMock
      }
    );

    expect(upsertMock).toHaveBeenCalledWith({
      namespace: "user:user-123",
      vectors: expect.arrayContaining([
        expect.objectContaining({
          id: "user-123:doc-123:0"
        })
      ])
    });
    expect(updateMock).toHaveBeenLastCalledWith({
      processed_chunks: 2,
      status: "completed",
      total_chunks: 2
    });
    expect(result).toEqual({
      namespace: "user:user-123",
      vectorCount: 2
    });
  });

  it("marks the document failed when indexing errors", async () => {
    eqUserMock.mockResolvedValue({ error: null });
    upsertMock.mockRejectedValue(new Error("Pinecone unavailable."));

    await expect(
      indexDocumentEmbeddings(
        {
          chunks,
          documentId: "doc-123",
          fileName: "handbook.md",
          supabase: supabaseMock as never,
          userId: "user-123",
          vectors
        },
        {
          upsert: upsertMock
        }
      )
    ).rejects.toThrow(/pinecone unavailable/i);

    expect(updateMock).toHaveBeenNthCalledWith(1, {
      error_message: null,
      status: "indexing"
    });
    expect(updateMock).toHaveBeenNthCalledWith(2, {
      error_message: "Pinecone unavailable.",
      status: "failed"
    });
  });
});
