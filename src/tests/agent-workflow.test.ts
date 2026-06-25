import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createChatModel,
  invokeChatAgent,
  resolveChatModelConfig
} from "@/server/agent/workflow";

const supabaseMock = {} as never;
const credentialResolverMock = vi.fn();
const fetchMock = vi.fn();

describe("chat agent workflow", () => {
  beforeEach(() => {
    credentialResolverMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    delete process.env.DEFAULT_CHAT_PROVIDER;
    delete process.env.DEFAULT_CHAT_MODEL;
    process.env.OPENAI_API_KEY = "test-openai-key";
    delete process.env.GEMINI_API_KEY;
  });

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
        requestedModel: "gpt-4.1-mini",
        requestedProvider: "openai",
        sessionId: "session-1",
        supabase: supabaseMock,
        thinkingLevel: "medium",
        userId: "user-123"
      },
      {
        credentialResolver: credentialResolverMock as never,
        dateTimeTool: dateTimeTool as never,
        llmFactory: () => llm,
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
        requestedModel: "gpt-4.1-mini",
        requestedProvider: "openai",
        sessionId: "session-2",
        supabase: supabaseMock,
        thinkingLevel: "medium",
        userId: "user-123"
      },
      {
        credentialResolver: credentialResolverMock as never,
        dateTimeTool: dateTimeTool as never,
        llmFactory: () => llm,
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
        requestedModel: "gpt-4.1-mini",
        requestedProvider: "openai",
        sessionId: "session-3",
        supabase: supabaseMock,
        thinkingLevel: "medium",
        userId: "user-123"
      },
      {
        credentialResolver: credentialResolverMock as never,
        dateTimeTool: vi.fn() as never,
        llmFactory: () => llm,
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

  it("uses an enabled runtime MCP tool after low-confidence document retrieval", async () => {
    const vectorSearchTool = vi.fn().mockResolvedValue({
      matches: []
    });
    const runtimeMcpTool = {
      description: "Look up live weather",
      invoke: vi.fn().mockResolvedValue("Weather is 31C with light rain."),
      name: "weather_lookup"
    };
    const llm = {
      invoke: vi.fn().mockResolvedValue({
        content: "The runtime MCP weather tool says it is 31C with light rain."
      })
    };

    const result = await invokeChatAgent(
      {
        history: [],
        message: "What is the weather in Pune?",
        requestedModel: "gpt-4.1-mini",
        requestedProvider: "openai",
        sessionId: "session-mcp-1",
        supabase: supabaseMock,
        thinkingLevel: "medium",
        userId: "user-123"
      },
      {
        credentialResolver: credentialResolverMock as never,
        dateTimeTool: vi.fn() as never,
        llmFactory: () => llm,
        runtimeMcpToolsLoader: vi.fn().mockResolvedValue([runtimeMcpTool]) as never,
        traceInvocation: async (_, invoke) => ({
          result: await invoke(),
          runId: "trace-mcp-123"
        }),
        vectorSearchTool: vectorSearchTool as never,
        webSearchTool: vi.fn() as never
      }
    );

    expect(vectorSearchTool).toHaveBeenCalled();
    expect(runtimeMcpTool.invoke).toHaveBeenCalledWith({
      query: "What is the weather in Pune?"
    });
    expect(result.metadata.sources).toEqual([
      "Runtime MCP (weather_lookup) - Weather is 31C with light rain."
    ]);
    expect(result.metadata.toolActivity).toContain(
      "weather_lookup -> returned runtime MCP output"
    );
  });

  it("does not call runtime MCP tools when document retrieval is strong", async () => {
    const runtimeMcpTool = {
      description: "Fallback live tool",
      invoke: vi.fn(),
      name: "remote_lookup"
    };

    await invokeChatAgent(
      {
        history: [],
        message: "What does the onboarding runbook say about approval?",
        requestedModel: "gpt-4.1-mini",
        requestedProvider: "openai",
        sessionId: "session-mcp-2",
        supabase: supabaseMock,
        thinkingLevel: "medium",
        userId: "user-123"
      },
      {
        credentialResolver: credentialResolverMock as never,
        dateTimeTool: vi.fn() as never,
        llmFactory: () => ({
          invoke: vi.fn().mockResolvedValue({
            content: "Manager approval is required."
          })
        }),
        runtimeMcpToolsLoader: vi.fn().mockResolvedValue([runtimeMcpTool]) as never,
        traceInvocation: async (_, invoke) => ({
          result: await invoke(),
          runId: "trace-mcp-456"
        }),
        vectorSearchTool: vi.fn().mockResolvedValue({
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
        }) as never,
        webSearchTool: vi.fn() as never
      }
    );

    expect(runtimeMcpTool.invoke).not.toHaveBeenCalled();
  });

  it("resolves a saved Gemini chat configuration", async () => {
    credentialResolverMock.mockResolvedValue("saved-gemini-key");

    await expect(
      resolveChatModelConfig({
        credentialResolver: credentialResolverMock as never,
        requestedModel: "gemini-2.5-flash",
        requestedProvider: "gemini",
        supabase: supabaseMock,
        userId: "user-123"
      })
    ).resolves.toEqual({
      apiKey: "saved-gemini-key",
      model: "gemini-2.5-flash",
      provider: "gemini"
    });
  });

  it("falls back to the configured default chat provider when saved settings use an unsupported provider", async () => {
    process.env.DEFAULT_CHAT_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "fallback-gemini-key";

    await expect(
      resolveChatModelConfig({
        credentialResolver: credentialResolverMock as never,
        requestedModel: "claude-sonnet",
        requestedProvider: "anthropic",
        supabase: supabaseMock,
        userId: "user-123"
      })
    ).resolves.toEqual({
      apiKey: "fallback-gemini-key",
      model: "gemini-2.5-flash-lite",
      provider: "gemini"
    });
    expect(credentialResolverMock).not.toHaveBeenCalled();
  });

  it("invokes Gemini chat models without throwing the unsupported-provider error", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: "Grounded Gemini answer"
                }
              ]
            }
          }
        ]
      }),
      ok: true
    });

    const model = createChatModel({
      apiKey: "gemini-key",
      model: "models/gemini-2.5-flash",
      provider: "gemini"
    });
    const response = await model.invoke([
      new SystemMessage("You are helpful."),
      new HumanMessage("Summarize the supplied context.")
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-goog-api-key": "gemini-key"
        }),
        method: "POST"
      })
    );
    expect(response.content).toBe("Grounded Gemini answer");
  });
});
