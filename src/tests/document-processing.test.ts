import { beforeEach, describe, expect, it, vi } from "vitest";
import { processUploadedDocument } from "@/server/documents/process";

const parseDocumentMock = vi.fn();
const chunkDocumentMock = vi.fn();
const generateDocumentEmbeddingsMock = vi.fn();
const indexDocumentEmbeddingsMock = vi.fn();
const logInfoMock = vi.fn();
const logErrorMock = vi.fn();

vi.mock("@/server/documents/parser", () => ({
  parseDocument: (...args: unknown[]) => parseDocumentMock(...args)
}));

vi.mock("@/server/documents/chunking", () => ({
  chunkDocument: (...args: unknown[]) => chunkDocumentMock(...args)
}));

vi.mock("@/server/embeddings/service", () => ({
  generateDocumentEmbeddings: (...args: unknown[]) =>
    generateDocumentEmbeddingsMock(...args)
}));

vi.mock("@/server/pinecone/client", () => ({
  createPineconeUpsertClient: () => ({
    upsert: vi.fn()
  })
}));

vi.mock("@/server/pinecone/indexing", () => ({
  indexDocumentEmbeddings: (...args: unknown[]) => indexDocumentEmbeddingsMock(...args)
}));

vi.mock("@/server/logging/events", () => ({
  appEventLogger: {
    error: (...args: unknown[]) => logErrorMock(...args),
    info: (...args: unknown[]) => logInfoMock(...args)
  }
}));

describe("processUploadedDocument", () => {
  beforeEach(() => {
    parseDocumentMock.mockReset();
    chunkDocumentMock.mockReset();
    generateDocumentEmbeddingsMock.mockReset();
    indexDocumentEmbeddingsMock.mockReset();
    logInfoMock.mockReset();
    logErrorMock.mockReset();
  });

  it("runs parsing, chunking, embedding, and Pinecone indexing in order", async () => {
    parseDocumentMock.mockResolvedValue({
      text: "team handbook content"
    });
    chunkDocumentMock.mockResolvedValue({
      chunks: [
        {
          chunkIndex: 0,
          content: "team handbook content",
          contentPreview: "team handbook content",
          pineconeVectorId: "user-123:doc-123:0",
          tokenCount: 3
        }
      ],
      insertedCount: 1
    });
    generateDocumentEmbeddingsMock.mockResolvedValue({
      config: {
        model: "text-embedding-3-small",
        provider: "openai"
      },
      vectors: [{ chunkIndex: 0, values: [0.1, 0.2] }]
    });
    indexDocumentEmbeddingsMock.mockResolvedValue({
      namespace: "user:user-123",
      vectorCount: 1
    });

    const supabase = { from: vi.fn() } as never;
    const pineconeClient = { upsert: vi.fn() };

    const result = await processUploadedDocument(
      {
        documentId: "doc-123",
        fileContents: "# team handbook",
        fileName: "handbook.md",
        fileType: "text/markdown",
        supabase,
        userId: "user-123"
      },
      {
        pineconeClient
      }
    );

    expect(parseDocumentMock).toHaveBeenCalledWith({
      documentId: "doc-123",
      fileContents: "# team handbook",
      fileName: "handbook.md",
      fileType: "text/markdown",
      supabase,
      userId: "user-123"
    });
    expect(chunkDocumentMock).toHaveBeenCalledWith({
      documentId: "doc-123",
      fileName: "handbook.md",
      supabase,
      text: "team handbook content",
      userId: "user-123"
    });
    expect(generateDocumentEmbeddingsMock).toHaveBeenCalledWith(
      {
        chunks: [
          {
            chunkIndex: 0,
            content: "team handbook content",
            contentPreview: "team handbook content",
            pineconeVectorId: "user-123:doc-123:0",
            tokenCount: 3
          }
        ],
        documentId: "doc-123",
        supabase,
        userId: "user-123"
      },
      undefined
    );
    expect(indexDocumentEmbeddingsMock).toHaveBeenCalledWith(
      {
        chunks: [
          {
            chunkIndex: 0,
            content: "team handbook content",
            contentPreview: "team handbook content",
            pineconeVectorId: "user-123:doc-123:0",
            tokenCount: 3
          }
        ],
        documentId: "doc-123",
        fileName: "handbook.md",
        supabase,
        userId: "user-123",
        vectors: [{ chunkIndex: 0, values: [0.1, 0.2] }]
      },
      pineconeClient
    );
    expect(result).toEqual({
      namespace: "user:user-123",
      vectorCount: 1
    });
    expect(logInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "doc-123",
        event: "documents.processing.started",
        userId: "user-123"
      })
    );
    expect(logInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "doc-123",
        event: "documents.processing.completed",
        metadata: expect.objectContaining({
          chunkCount: 1,
          namespace: "user:user-123",
          vectorCount: 1
        }),
        userId: "user-123"
      })
    );
  });

  it("logs a structured failure event when processing fails", async () => {
    parseDocumentMock.mockRejectedValue(new Error("Parser failed."));

    await expect(
      processUploadedDocument({
        documentId: "doc-123",
        fileContents: "# team handbook",
        fileName: "handbook.md",
        fileType: "text/markdown",
        supabase: { from: vi.fn() } as never,
        userId: "user-123"
      })
    ).rejects.toThrow(/parser failed/i);

    expect(logErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "doc-123",
        errorMessage: "Parser failed.",
        event: "documents.processing.failed",
        userId: "user-123"
      })
    );
  });
});
