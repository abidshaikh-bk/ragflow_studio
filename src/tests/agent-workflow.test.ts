import { describe, expect, it, vi } from "vitest";
import { invokeChatAgent } from "@/server/agent/workflow";

const supabaseMock = {} as never;

describe("chat agent workflow", () => {
  it("uses vector search for document-grounded questions", async () => {
    const vectorSearchTool = vi.fn().mockResolvedValue({
      matches: [
        {
          chunkIndex: 2,
          contentPreview: "The onboarding runbook requires manager approval.",
          documentId: "doc-1",
          fileName: "runbook.md",
          id: "match-1",
          score: 0.92
        }
      ]
    });
    const dateTimeTool = vi.fn();
    const webSearchTool = vi.fn();
    const llm = {
      invoke: vi.fn().mockResolvedValue({
        content: "The onboarding runbook says manager approval is required."
      })
    };

    const result = await invokeChatAgent(
      {
        history: [],
        message: "What does the onboarding runbook say about approval?",
        sessionId: "session-1",
        supabase: supabaseMock,
        userId: "user-123"
      },
      {
        dateTimeTool: dateTimeTool as never,
        llmFactory: () => llm,
        settingsResolver: async () => ({
          chatApiKeyMasked: null,
          chatModel: "gpt-4.1-mini",
          chatProvider: "openai",
          embeddingApiKeyMasked: null,
          embeddingDimensions: 1024,
          embeddingModel: "text-embedding-3-small",
          embeddingProvider: "openai"
        }),
        traceInvocation: async (_, invoke) => ({
          result: await invoke(),
          runId: "trace-123"
        }),
        vectorSearchTool: vectorSearchTool as never,
        webSearchTool: webSearchTool as never
      }
    );

    expect(vectorSearchTool).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "What does the onboarding runbook say about approval?",
        sessionId: "session-1",
        userId: "user-123"
      })
    );
    expect(dateTimeTool).not.toHaveBeenCalled();
    expect(webSearchTool).not.toHaveBeenCalled();
    expect(result.metadata.sources).toEqual([
      "runbook.md chunk 2: The onboarding runbook requires manager approval."
    ]);
    expect(result.langsmithRunId).toBe("trace-123");
  });

  it("uses the date tool for temporal questions", async () => {
    const dateTimeTool = vi.fn().mockResolvedValue({
      friendlyDateTime: "Sunday, June 21, 2026 at 12:34:56 PM UTC",
      isoDateTime: "2026-06-21T12:34:56.000Z",
      timeZone: "UTC"
    });
    const llm = {
      invoke: vi.fn().mockResolvedValue({
        content: "It is Sunday, June 21, 2026 at 12:34:56 PM UTC."
      })
    };

    const result = await invokeChatAgent(
      {
        history: [],
        message: "What date is it today?",
        sessionId: "session-2",
        supabase: supabaseMock,
        userId: "user-123"
      },
      {
        dateTimeTool: dateTimeTool as never,
        llmFactory: () => llm,
        settingsResolver: async () => ({
          chatApiKeyMasked: null,
          chatModel: "gpt-4.1-mini",
          chatProvider: "openai",
          embeddingApiKeyMasked: null,
          embeddingDimensions: 1024,
          embeddingModel: "text-embedding-3-small",
          embeddingProvider: "openai"
        }),
        traceInvocation: async (_, invoke) => ({
          result: await invoke(),
          runId: "trace-456"
        }),
        vectorSearchTool: vi.fn() as never,
        webSearchTool: vi.fn() as never
      }
    );

    expect(dateTimeTool).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-2",
        userId: "user-123"
      })
    );
    expect(result.metadata.sources).toEqual([
      "Current date/time (UTC) - 2026-06-21T12:34:56.000Z"
    ]);
  });

  it("uses Tavily for current-information questions", async () => {
    const webSearchTool = vi.fn().mockResolvedValue({
      requestId: "tvly-123",
      responseTime: 410,
      results: [
        {
          publishedDate: "2026-06-21",
          score: 0.81,
          snippet: "A concise update from the web.",
          title: "Latest AI update",
          url: "https://example.com/latest-ai"
        }
      ]
    });
    const llm = {
      invoke: vi.fn().mockResolvedValue({
        content: "The latest AI update says progress continued this week."
      })
    };

    const result = await invokeChatAgent(
      {
        history: [],
        message: "What is the latest AI news today?",
        sessionId: "session-3",
        supabase: supabaseMock,
        userId: "user-123"
      },
      {
        dateTimeTool: vi.fn() as never,
        llmFactory: () => llm,
        settingsResolver: async () => ({
          chatApiKeyMasked: null,
          chatModel: "gpt-4.1-mini",
          chatProvider: "openai",
          embeddingApiKeyMasked: null,
          embeddingDimensions: 1024,
          embeddingModel: "text-embedding-3-small",
          embeddingProvider: "openai"
        }),
        traceInvocation: async (_, invoke) => ({
          result: await invoke(),
          runId: "trace-789"
        }),
        vectorSearchTool: vi.fn() as never,
        webSearchTool: webSearchTool as never
      }
    );

    expect(webSearchTool).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "What is the latest AI news today?",
        sessionId: "session-3",
        userId: "user-123"
      })
    );
    expect(result.metadata.sources).toEqual([
      "Latest AI update - https://example.com/latest-ai"
    ]);
    expect(result.metadata.toolActivity).toEqual([
      "tavily.search -> returned 1 web result"
    ]);
  });
});
