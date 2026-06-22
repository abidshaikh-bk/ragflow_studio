import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateDocumentEmbeddings } from "@/server/embeddings/service";

const getUserSettingsMock = vi.fn();
const getProviderCredentialSecretMock = vi.fn();
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
  getProviderCredentialSecret: (...args: unknown[]) =>
    getProviderCredentialSecretMock(...args),
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
    getProviderCredentialSecretMock.mockReset();
    fromMock.mockClear();
    updateMock.mockClear();
    eqIdMock.mockClear();
    eqUserMock.mockReset();
  });

  it("passes the expected chunk text to the embedding client", async () => {
    eqUserMock.mockResolvedValue({ error: null });
    getProviderCredentialSecretMock.mockResolvedValue("user-openai-key");
    getUserSettingsMock.mockResolvedValue({
      embeddingDimensions: 2,
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
      dimensions: 2,
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
    getProviderCredentialSecretMock.mockResolvedValue("user-openai-key");
    getUserSettingsMock.mockResolvedValue({
      embeddingDimensions: 2,
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

  it("uses the saved Gemini embedding provider when configured", async () => {
    eqUserMock.mockResolvedValue({ error: null });
    getProviderCredentialSecretMock.mockResolvedValue("saved-gemini-key");
    getUserSettingsMock.mockResolvedValue({
      embeddingDimensions: 3,
      embeddingModel: "gemini-embedding-001",
      embeddingProvider: "gemini"
    });
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        embedding: { values: [0.1, 0.2, 0.3] }
      }),
      ok: true
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      await generateDocumentEmbeddings({
        chunks: [baseChunks[0]],
        documentId: "doc-123",
        supabase: supabaseMock as never,
        userId: "user-123"
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent",
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-goog-api-key": "saved-gemini-key"
          })
        })
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("falls back to the configured default provider when saved settings use an unsupported provider", async () => {
    eqUserMock.mockResolvedValue({ error: null });
    getProviderCredentialSecretMock.mockResolvedValue(null);
    getUserSettingsMock.mockResolvedValue({
      embeddingDimensions: 2,
      embeddingModel: "sentence-transformers/all-MiniLM-L6-v2",
      embeddingProvider: "huggingface"
    });
    const originalDefaultProvider = process.env.DEFAULT_EMBEDDING_PROVIDER;
    const originalDefaultModel = process.env.DEFAULT_EMBEDDING_MODEL;
    const originalGeminiApiKey = process.env.GEMINI_API_KEY;
    process.env.DEFAULT_EMBEDDING_PROVIDER = "gemini";
    process.env.DEFAULT_EMBEDDING_MODEL = "";
    process.env.GEMINI_API_KEY = "fallback-gemini-key";

    try {
      const embedder = vi.fn().mockResolvedValue([
        [0.1, 0.2],
        [0.3, 0.4],
        [0.5, 0.6]
      ]);

      await generateDocumentEmbeddings(
        {
          chunks: baseChunks,
          documentId: "doc-123",
          supabase: supabaseMock as never,
          userId: "user-123"
        },
        embedder
      );

      expect(embedder).toHaveBeenCalledWith({
        dimensions: 2,
        model: "gemini-embedding-2",
        provider: "gemini",
        texts: ["first chunk text", "second chunk text", "third chunk text"]
      });
    } finally {
      process.env.DEFAULT_EMBEDDING_PROVIDER = originalDefaultProvider;
      process.env.DEFAULT_EMBEDDING_MODEL = originalDefaultModel;
      process.env.GEMINI_API_KEY = originalGeminiApiKey;
    }
  });

  it("marks the document as failed when embedding generation fails", async () => {
    eqUserMock.mockResolvedValue({ error: null });
    getProviderCredentialSecretMock.mockResolvedValue("user-openai-key");
    getUserSettingsMock.mockResolvedValue({
      embeddingDimensions: 2,
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

  it("uses the saved embedding credential when no environment key is present", async () => {
    const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
    eqUserMock.mockResolvedValue({ error: null });
    getProviderCredentialSecretMock.mockResolvedValue("saved-user-openai-key");
    getUserSettingsMock.mockResolvedValue({
      embeddingDimensions: 3,
      embeddingModel: "text-embedding-3-small",
      embeddingProvider: "openai"
    });
    delete process.env.OPENAI_API_KEY;

    try {
      const fetchMock = vi.fn().mockResolvedValue({
        json: async () => ({
          data: [{ embedding: [0.1, 0.2, 0.3] }]
        }),
        ok: true
      });
      vi.stubGlobal("fetch", fetchMock);

      await generateDocumentEmbeddings({
        chunks: [baseChunks[0]],
        documentId: "doc-123",
        supabase: supabaseMock as never,
        userId: "user-123"
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.openai.com/v1/embeddings",
        expect.objectContaining({
          headers: expect.objectContaining({
            authorization: "Bearer saved-user-openai-key"
          })
        })
      );
    } finally {
      process.env.OPENAI_API_KEY = originalOpenAiApiKey;
      vi.unstubAllGlobals();
    }
  });

  it("fails when the provider returns the wrong vector dimension", async () => {
    eqUserMock.mockResolvedValue({ error: null });
    getProviderCredentialSecretMock.mockResolvedValue("user-openai-key");
    getUserSettingsMock.mockResolvedValue({
      embeddingDimensions: 1024,
      embeddingModel: "text-embedding-3-small",
      embeddingProvider: "openai"
    });

    await expect(
      generateDocumentEmbeddings(
        {
          chunks: [baseChunks[0]],
          documentId: "doc-123",
          supabase: supabaseMock as never,
          userId: "user-123"
        },
        vi.fn().mockResolvedValue([[0.1, 0.2]])
      )
    ).rejects.toThrow(/returned 2 dimensions, expected 1024/i);
  });
});
