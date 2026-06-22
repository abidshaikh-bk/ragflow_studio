import type { SupabaseClient } from "@supabase/supabase-js";
import { tavily, type TavilySearchResponse } from "@tavily/core";
import { getTavilyEnv } from "@/lib/env";
import { parseWebSearchInput } from "@/lib/validations/web-search";

export type WebSearchResult = {
  publishedDate: string | null;
  score: number | null;
  snippet: string;
  title: string;
  url: string;
};

type WebSearchParams = {
  maxResults?: number;
  query: string;
  sessionId?: string;
  supabase: SupabaseClient;
  userId: string;
};

type WebSearchClient = {
  search: (
    query: string,
    options?: {
      includeAnswer?: boolean;
      includeImages?: boolean;
      maxResults?: number;
      searchDepth?: "advanced" | "basic" | "fast" | "ultra-fast";
      timeout?: number;
      topic?: "finance" | "general" | "news";
    }
  ) => Promise<TavilySearchResponse>;
};

type WebSearchDeps = {
  client: WebSearchClient;
};

const SEARCH_TIMEOUT_MS = 8_000;

export async function searchWeb(
  {
    maxResults,
    query,
    sessionId,
    supabase,
    userId
  }: WebSearchParams,
  deps?: Partial<WebSearchDeps>
) {
  const input = parseWebSearchInput({
    maxResults,
    query
  });
  const startedAt = Date.now();

  try {
    const client = deps?.client ?? createTavilyClient();
    const response = await client.search(input.query, {
      includeAnswer: false,
      includeImages: false,
      maxResults: input.maxResults,
      searchDepth: "advanced",
      timeout: SEARCH_TIMEOUT_MS,
      topic: "general"
    });
    const results = response.results.map((result) => ({
      publishedDate: result.publishedDate || null,
      score: result.score ?? null,
      snippet: normalizeSnippet(result.content),
      title: result.title.trim() || "Untitled result",
      url: result.url
    }));
    const output = {
      requestId: response.requestId,
      responseTime: response.responseTime,
      results
    };

    await logToolCall(supabase, {
      input,
      latencyMs: Date.now() - startedAt,
      output,
      sessionId,
      status: "success",
      userId
    });

    return output;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to search the web.";

    await logToolCall(supabase, {
      input,
      latencyMs: Date.now() - startedAt,
      output: {
        error: message
      },
      sessionId,
      status: "failed",
      userId
    });

    throw new Error(message);
  }
}

function createTavilyClient(): WebSearchClient {
  const { apiKey } = getTavilyEnv();

  return tavily({
    apiKey
  });
}

function normalizeSnippet(content: string) {
  const collapsed = content.replace(/\s+/g, " ").trim();

  if (collapsed.length <= 240) {
    return collapsed;
  }

  return `${collapsed.slice(0, 237).trimEnd()}...`;
}

async function logToolCall(
  supabase: SupabaseClient,
  input: {
    input: {
      maxResults: number;
      query: string;
    };
    latencyMs: number;
    output: object;
    sessionId?: string;
    status: string;
    userId: string;
  }
) {
  if (!input.sessionId) {
    return;
  }

  const result = await supabase.from("agent_tool_calls").insert({
    latency_ms: input.latencyMs,
    session_id: input.sessionId,
    status: input.status,
    tool_input: input.input,
    tool_name: "tavily.search",
    tool_output: input.output,
    user_id: input.userId
  });

  if (result.error) {
    throw new Error("Unable to log the Tavily web search tool call.");
  }
}
