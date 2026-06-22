import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchWeb } from "@/server/tools/web-search";

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

describe("web search tool", () => {
  beforeEach(() => {
    fromMock.mockClear();
    insertMock.mockReset();
  });

  it("validates the input query", async () => {
    await expect(
      searchWeb(
        {
          query: "   ",
          supabase: supabaseMock as never,
          userId: "user-123"
        },
        {
          client: {
            search: vi.fn()
          }
        }
      )
    ).rejects.toThrow(/enter a web search query/i);
  });

  it("returns normalized Tavily search results", async () => {
    insertMock.mockResolvedValue({ error: null });
    const searchMock = vi.fn().mockResolvedValue({
      query: "latest rag patterns",
      requestId: "tvly-123",
      responseTime: 612,
      results: [
        {
          content:
            "   Tavily returned a long summary with extra spacing.\n\nIt should be normalized into a compact snippet for the chat metadata panel.   ",
          publishedDate: "2026-06-21",
          score: 0.87,
          title: " Tavily result one ",
          url: "https://example.com/rag"
        }
      ]
    });

    const result = await searchWeb(
      {
        maxResults: 2,
        sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
        query: "latest rag patterns",
        supabase: supabaseMock as never,
        userId: "user-123"
      },
      {
        client: {
          search: searchMock
        }
      }
    );

    expect(searchMock).toHaveBeenCalledWith("latest rag patterns", {
      includeAnswer: false,
      includeImages: false,
      maxResults: 2,
      searchDepth: "advanced",
      timeout: 8000,
      topic: "general"
    });
    expect(result).toEqual({
      requestId: "tvly-123",
      responseTime: 612,
      results: [
        {
          publishedDate: "2026-06-21",
          score: 0.87,
          snippet:
            "Tavily returned a long summary with extra spacing. It should be normalized into a compact snippet for the chat metadata panel.",
          title: "Tavily result one",
          url: "https://example.com/rag"
        }
      ]
    });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
        status: "success",
        tool_name: "tavily.search",
        user_id: "user-123"
      })
    );
  });

  it("logs Tavily failures with a failed status", async () => {
    insertMock.mockResolvedValue({ error: null });

    await expect(
      searchWeb(
        {
          query: "latest ai news",
          sessionId: "1f62d9cf-5230-4ad7-9573-0b7f8d252aef",
          supabase: supabaseMock as never,
          userId: "user-123"
        },
        {
          client: {
            search: vi.fn().mockRejectedValue(new Error("Tavily timed out."))
          }
        }
      )
    ).rejects.toThrow(/tavily timed out/i);

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        tool_name: "tavily.search"
      })
    );
  });
});
