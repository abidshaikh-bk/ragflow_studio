import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateDocumentEmbeddings } from "@/server/embeddings/service";

const getUserSettingsMock = vi.fn();
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

vi.mock("@/server/settings/service", () => ({
  getUserSettings: (...args: unknown[]) => getUserSettingsMock(...args)
}));

const baseChunks = [
  {
    chunkIndex: 0,
    content: "first chunk text",
    contentPreview: "first chunk text",
    pineconeVectorId: "user-123:doc-123:0",
    tokenCount: 3
  },
  {
    chunkIndex: 1,
    content: "second chunk text",
    contentPreview: "second chunk text",
    pineconeVectorId: "user-123:doc-123:1",
    tokenCount: 3
  },
  {
    chunkIndex: 2,
    content: "third chunk text",
    contentPreview: "third chunk text",
    pineconeVectorId: "user-123:doc-123:2",
    tokenCount: 3
  }
];

describe("document embeddings", () => {
  beforeEach(() => {
    getUserSettingsMock.mockReset();
    fromMock.mockClear();
    updateMock.mockClear();
    eqIdMock.mockClear();
    eqUserMock.mockReset();
  });

  it("passes the expected chunk text to the embedding client", async () => {
    eqUserMock.mockResolvedValue({ error: null });
    getUserSettingsMock.mockResolvedValue({
      embeddingModel: "text-embedding-3-small",
      embeddingProvider: "openai"
    });
    const embedder = vi.fn().mockResolvedValue([
      [0.1, 0.2],
      [0.3, 0.4],
      [0.5, 0.6]
    ]);

    const result = await generateDocumentEmbeddings(
      {
        chunks: baseChunks,
        documentId: "doc-123",
        supabase: supabaseMock as never,
        userId: "user-123"
      },
      embedder
    );

    expect(embedder).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      provider: "openai",
      texts: ["first chunk text", "second chunk text", "third chunk text"]
    });
    expect(result.vectors).toEqual([
      { chunkIndex: 0, values: [0.1, 0.2] },
      { chunkIndex: 1, values: [0.3, 0.4] },
      { chunkIndex: 2, values: [0.5, 0.6] }
    ]);
  });

  it("batches embedding requests and tracks progress", async () => {
    eqUserMock.mockResolvedValue({ error: null });
    getUserSettingsMock.mockResolvedValue({
      embeddingModel: "text-embedding-3-small",
      embeddingProvider: "openai"
    });
    const embedder = vi
      .fn()
      .mockResolvedValueOnce([
        [0.1, 0.2],
        [0.3, 0.4]
      ])
      .mockResolvedValueOnce([[0.5, 0.6]]);

    await generateDocumentEmbeddings(
      {
        batchSize: 2,
        chunks: baseChunks,
        documentId: "doc-123",
        supabase: supabaseMock as never,
        userId: "user-123"
      },
      embedder
    );

    expect(embedder).toHaveBeenCalledTimes(2);
    expect(updateMock).toHaveBeenNthCalledWith(2, {
      processed_chunks: 2
    });
    expect(updateMock).toHaveBeenNthCalledWith(3, {
      processed_chunks: 3
    });
  });

  it("marks the document as failed when embedding generation fails", async () => {
    eqUserMock.mockResolvedValue({ error: null });
    getUserSettingsMock.mockResolvedValue({
      embeddingModel: "text-embedding-3-small",
      embeddingProvider: "openai"
    });
    const embedder = vi.fn().mockRejectedValue(new Error("Embedding provider timed out."));

    await expect(
      generateDocumentEmbeddings(
        {
          chunks: baseChunks,
          documentId: "doc-123",
          supabase: supabaseMock as never,
          userId: "user-123"
        },
        embedder
      )
    ).rejects.toThrow(/embedding provider timed out/i);

    expect(updateMock).toHaveBeenNthCalledWith(1, {
      error_message: null,
      status: "embedding"
    });
    expect(updateMock).toHaveBeenNthCalledWith(2, {
      error_message: "Embedding provider timed out.",
      status: "failed"
    });
  });
});
