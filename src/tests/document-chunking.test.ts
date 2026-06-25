import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  chunkDocument,
  createDocumentChunks
} from "@/server/documents/chunking";

const eqUserMock = vi.fn();
const eqIdMock = vi.fn(() => ({
  eq: eqUserMock
}));
const selectMock = vi.fn();
const insertMock = vi.fn(() => ({
  select: selectMock
}));
const deleteEqUserMock = vi.fn();
const deleteEqDocumentMock = vi.fn(() => ({
  eq: deleteEqUserMock
}));
const deleteMock = vi.fn(() => ({
  eq: deleteEqDocumentMock
}));
const updateMock = vi.fn(() => ({
  eq: eqIdMock
}));
const fromMock = vi.fn((table: string) => {
  if (table === "document_chunks") {
    return {
      delete: deleteMock,
      insert: insertMock
    };
  }

  return {
    update: updateMock
  };
});

const supabaseMock = {
  from: fromMock
};

describe("document chunking", () => {
  beforeEach(() => {
    fromMock.mockClear();
    updateMock.mockClear();
    eqIdMock.mockClear();
    eqUserMock.mockReset();
    deleteMock.mockClear();
    deleteEqDocumentMock.mockClear();
    deleteEqUserMock.mockReset();
    insertMock.mockClear();
    selectMock.mockReset();
  });

  it("splits long text into multiple chunks", () => {
    const chunks = createDocumentChunks({
      chunkSize: 80,
      documentId: "doc-123",
      fileName: "handbook.md",
      overlap: 10,
      text: "alpha ".repeat(60),
      userId: "user-123"
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.content.length).toBeLessThanOrEqual(80);
  });

  it("preserves metadata for each chunk", () => {
    const chunks = createDocumentChunks({
      chunkSize: 60,
      documentId: "doc-789",
      fileName: "policy.md",
      overlap: 5,
      text: "approval flow requires manager review before execution ".repeat(8),
      userId: "user-123"
    });

    expect(chunks[0]).toMatchObject({
      chunkIndex: 0,
      pineconeVectorId: "user-123:doc-789:0"
    });
    expect(chunks[0]?.contentPreview.length).toBeLessThanOrEqual(200);
    expect(chunks[0]?.tokenCount).toBeGreaterThan(0);
  });

  it("fails gracefully for empty input", async () => {
    eqUserMock
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });

    await expect(
      chunkDocument({
        documentId: "doc-empty",
        fileName: "empty.txt",
        supabase: supabaseMock as never,
        text: "   ",
        userId: "user-123"
      })
    ).rejects.toThrow(/must contain enough text to create chunks/i);

    expect(updateMock).toHaveBeenNthCalledWith(1, {
      error_message: null,
      status: "chunking"
    });
    expect(updateMock).toHaveBeenNthCalledWith(2, {
      error_message: "Parsed documents must contain enough text to create chunks.",
      status: "failed"
    });
  });

  it("inserts chunk rows with the expected metadata", async () => {
    eqUserMock.mockResolvedValue({ error: null });
    deleteEqUserMock.mockResolvedValue({ error: null });
    selectMock.mockResolvedValue({
      data: [{ chunk_index: 0 }, { chunk_index: 1 }],
      error: null
    });

    const result = await chunkDocument({
      chunkSize: 70,
      documentId: "doc-123",
      fileName: "handbook.md",
      overlap: 10,
      supabase: supabaseMock as never,
      text: "manager approval is required before production deploys ".repeat(12),
      userId: "user-123"
    });

    expect(deleteMock).toHaveBeenCalled();
    expect(insertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          chunk_index: 0,
          document_id: "doc-123",
          pinecone_vector_id: "user-123:doc-123:0",
          user_id: "user-123"
        })
      ])
    );
    expect(updateMock).toHaveBeenLastCalledWith({
      chunking_strategy_snapshot: {
        chunkSize: 70,
        method: "whitespace-window",
        overlap: 10
      },
      processed_chunks: result.chunks.length,
      total_chunks: result.chunks.length
    });
    expect(result.insertedCount).toBe(2);
  });
});
