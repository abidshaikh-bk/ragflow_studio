import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryDocumentVectors } from "@/server/tools/vector-search";

vi.mock("@/server/settings/service", () => ({
  getUserSettings: async () => ({
    chatApiKeyMasked: null,
    chatModel: "gpt-4.1-mini",
    chatProvider: "openai",
    embeddingApiKeyMasked: null,
    embeddingModel: "text-embedding-3-small",
    embeddingProvider: "openai"
  })
}));

const insertMock = vi.fn();
const fromMock = vi.fn((table: string) => {
  if (table === "agent_tool_calls") {
    return {
      insert: insertMock
    };
  }

  throw new Error(`Unexpected table: ${table}`);
});

const supabaseMock = {
  from: fromMock
};

describe("vector search tool", () => {
  beforeEach(() => {
    fromMock.mockClear();
    insertMock.mockReset();
  });

  it("validates the input query", async () => {
    await expect(
      queryDocumentVectors(
        {
          query: "   ",
          supabase: supabaseMock as never,
          userId: "user-123"
        },
        {
          embedder: vi.fn(),
          pineconeClient: {
            query: vi.fn()
          }
        }
      )
    ).rejects.toThrow(/enter a search query/i);
  });

  it("queries the authenticated user's namespace and returns chunk metadata", async () => {
    insertMock.mockResolvedValue({ error: null });
    const embedder = vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]);
    const pineconeQuery = vi.fn().mockResolvedValue({
      matches: [
        {
          id: "user-123:doc-123:0",
          metadata: {
            chunkIndex: 0,
            contentPreview: "approval flow content",
            documentId: "6ad7b3d9-a244-4d83-8a52-715031bcf9f1",
            fileName: "handbook.md",
            userId: "user-123"
          },
          score: 0.98
        }
      ]
    });

    const result = await queryDocumentVectors(
      {
        documentIds: ["6ad7b3d9-a244-4d83-8a52-715031bcf9f1"],
        query: "approval flow",
        sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
        supabase: supabaseMock as never,
        topK: 3,
        userId: "user-123"
      },
      {
        embedder,
        pineconeClient: {
          query: pineconeQuery
        }
      }
    );

    expect(embedder).toHaveBeenCalledWith({
      model: expect.any(String),
      provider: expect.any(String),
      texts: ["approval flow"]
    });
    expect(pineconeQuery).toHaveBeenCalledWith({
      filter: {
        documentId: {
          $in: ["6ad7b3d9-a244-4d83-8a52-715031bcf9f1"]
        }
      },
      includeMetadata: true,
      namespace: "user:user-123",
      topK: 3,
      vector: [0.1, 0.2, 0.3]
    });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
        status: "success",
        tool_name: "pinecone.query",
        user_id: "user-123"
      })
    );
    expect(result.matches).toEqual([
      {
        chunkIndex: 0,
        contentPreview: "approval flow content",
        documentId: "6ad7b3d9-a244-4d83-8a52-715031bcf9f1",
        fileName: "handbook.md",
        id: "user-123:doc-123:0",
        score: 0.98
      }
    ]);
  });

  it("logs failed searches without leaking another user's namespace", async () => {
    insertMock.mockResolvedValue({ error: null });
    const pineconeQuery = vi.fn().mockRejectedValue(new Error("Pinecone unavailable."));

    await expect(
      queryDocumentVectors(
        {
          query: "approval flow",
          sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
          supabase: supabaseMock as never,
          userId: "user-123"
        },
        {
          embedder: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
          pineconeClient: {
            query: pineconeQuery
          }
        }
      )
    ).rejects.toThrow(/pinecone unavailable/i);

    expect(pineconeQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: "user:user-123"
      })
    );
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        tool_name: "pinecone.query"
      })
    );
  });
});
