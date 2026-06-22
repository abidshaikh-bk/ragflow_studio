import { beforeEach, describe, expect, it, vi } from "vitest";

const traceableMock = vi.fn();

vi.mock("langsmith/traceable", () => ({
  traceable: (...args: unknown[]) => traceableMock(...args)
}));

describe("LangSmith tracing helpers", () => {
  beforeEach(() => {
    traceableMock.mockReset();
  });

  it("returns the real result while tracing only the serialized payload", async () => {
    let tracedResult: unknown;

    traceableMock.mockImplementation(
      (
        invoke: () => Promise<unknown>,
        config: {
          on_start?: (runTree?: { id?: string | null }) => void;
        }
      ) =>
        async () => {
          config.on_start?.({
            id: "trace-run-123"
          });
          tracedResult = await invoke();

          return tracedResult;
        }
    );

    const { traceServerExecution } = await import("@/server/langsmith/tracing");
    const actualResult = {
      answer: "The full answer should stay server-side.",
      sources: ["policy.md chunk 2: full sensitive excerpt"]
    };
    const result = await traceServerExecution({
      invoke: async () => actualResult,
      metadata: {
        userId: "user-123"
      },
      name: "ragflow-chat-agent",
      runType: "chain",
      serializeResult: (value) => ({
        answerPreview: value.answer.slice(0, 10),
        sourceCount: value.sources.length
      }),
      traceInput: {
        messagePreview: "Show me the latest policy update"
      }
    });

    expect(result).toEqual({
      result: actualResult,
      runId: "trace-run-123"
    });
    expect(tracedResult).toEqual({
      answerPreview: "The full a",
      sourceCount: 1
    });
  });

  it("uses the provided redacted trace input and falls back to a generated run id", async () => {
    let traceConfig:
      | {
          name?: string;
          processInputs?: () => unknown;
          tags?: string[];
        }
      | undefined;

    traceableMock.mockImplementation(
      (
        invoke: () => Promise<unknown>,
        config: {
          name?: string;
          processInputs?: () => unknown;
          tags?: string[];
        }
      ) => {
        traceConfig = config;

        return async () => invoke();
      }
    );

    const { traceServerExecution } = await import("@/server/langsmith/tracing");
    const result = await traceServerExecution({
      invoke: async () => ({
        requestId: "tvly-123",
        results: [{ title: "Latest update", url: "https://example.com" }]
      }),
      name: "ragflow-web-search-tool",
      runType: "tool",
      tags: ["chat", "tool", "web-search"],
      traceInput: {
        queryPreview: "latest ai news"
      }
    });

    expect(result.runId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(traceConfig?.name).toBe("ragflow-web-search-tool");
    expect(traceConfig?.tags).toEqual(["chat", "tool", "web-search"]);
    expect(traceConfig?.processInputs?.()).toEqual({
      queryPreview: "latest ai news"
    });
  });
});
