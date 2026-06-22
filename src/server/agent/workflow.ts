import { randomUUID } from "node:crypto";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import type { SupabaseClient } from "@supabase/supabase-js";
import { traceable } from "langsmith/traceable";
import type { ChatMessageMetadata } from "@/components/chat/types";
import { getUserSettings } from "@/server/settings/service";
import { getCurrentDateTime } from "@/server/tools/date-time";
import {
  queryDocumentVectors,
  type VectorSearchMatch
} from "@/server/tools/vector-search";
import { searchWeb, type WebSearchResult } from "@/server/tools/web-search";

type AgentHistoryMessage = {
  content: string;
  role: "assistant" | "system" | "tool" | "user";
};

type InvokeChatAgentParams = {
  history: AgentHistoryMessage[];
  message: string;
  sessionId?: string;
  supabase: SupabaseClient;
  userId: string;
};

type AgentResponse = {
  content: string;
  langsmithRunId: string | null;
  metadata: ChatMessageMetadata;
};

type LlmLike = {
  invoke: (messages: Array<HumanMessage | SystemMessage>) => Promise<{
    content: unknown;
  }>;
};

type AgentDeps = {
  dateTimeTool: typeof getCurrentDateTime;
  llmFactory: (input: {
    model: string;
    provider: string;
  }) => LlmLike;
  settingsResolver: typeof getUserSettings;
  traceInvocation: <T>(
    metadata: {
      message: string;
      sessionId?: string;
      userId: string;
    },
    invoke: () => Promise<T>
  ) => Promise<{
    result: T;
    runId: string | null;
  }>;
  vectorSearchTool: typeof queryDocumentVectors;
  webSearchTool: typeof searchWeb;
};

type AgentRoute = "date" | "vector" | "web";

const LOW_CONFIDENCE_SCORE = 0.65;

const AgentState = Annotation.Root({
  answer: Annotation<string>,
  history: Annotation<AgentHistoryMessage[]>({
    default: () => [],
    reducer: (_, right) => right
  }),
  message: Annotation<string>,
  route: Annotation<AgentRoute>,
  sources: Annotation<string[]>({
    default: () => [],
    reducer: (_, right) => right
  }),
  timeContext: Annotation<{
    friendlyDateTime: string;
    isoDateTime: string;
    timeZone: string;
  } | null>({
    default: () => null,
    reducer: (_, right) => right
  }),
  toolActivity: Annotation<string[]>({
    default: () => [],
    reducer: (_, right) => right
  }),
  vectorMatches: Annotation<VectorSearchMatch[]>({
    default: () => [],
    reducer: (_, right) => right
  }),
  webResults: Annotation<WebSearchResult[]>({
    default: () => [],
    reducer: (_, right) => right
  })
});

export async function invokeChatAgent(
  params: InvokeChatAgentParams,
  deps?: Partial<AgentDeps>
): Promise<AgentResponse> {
  const graph = createChatAgentGraph(params, deps);
  const traced = await (deps?.traceInvocation ?? defaultTraceInvocation)(
    {
      message: params.message,
      sessionId: params.sessionId,
      userId: params.userId
    },
    () =>
      graph.invoke({
        history: params.history,
        message: params.message
      })
  );

  return {
    content: traced.result.answer,
    langsmithRunId: traced.runId,
    metadata: {
      ...(traced.result.sources.length
        ? {
            sources: traced.result.sources
          }
        : {}),
      ...(traced.result.toolActivity.length
        ? {
            toolActivity: traced.result.toolActivity
          }
        : {})
    }
  };
}

function createChatAgentGraph(
  params: InvokeChatAgentParams,
  deps?: Partial<AgentDeps>
) {
  const resolvedDeps = {
    dateTimeTool: deps?.dateTimeTool ?? getCurrentDateTime,
    llmFactory: deps?.llmFactory ?? createChatModel,
    settingsResolver: deps?.settingsResolver ?? getUserSettings,
    vectorSearchTool: deps?.vectorSearchTool ?? queryDocumentVectors,
    webSearchTool: deps?.webSearchTool ?? searchWeb
  };

  return new StateGraph(AgentState)
    .addNode("routeQuestion", async (state) => ({
      route: classifyRoute(state.message)
    }))
    .addNode("runVectorSearch", async (state) => {
      const result = await resolvedDeps.vectorSearchTool({
        query: state.message,
        sessionId: params.sessionId,
        supabase: params.supabase,
        userId: params.userId
      });

      return {
        toolActivity: [
          `pinecone.query -> returned ${result.matches.length} document chunk${
            result.matches.length === 1 ? "" : "s"
          }`
        ],
        vectorMatches: result.matches
      };
    })
    .addNode("runDateTime", async () => {
      const result = await resolvedDeps.dateTimeTool({
        sessionId: params.sessionId,
        supabase: params.supabase,
        userId: params.userId
      });

      return {
        timeContext: result,
        toolActivity: [`date.now -> resolved ${result.timeZone} time context`]
      };
    })
    .addNode("runWebSearch", async (state) => {
      const result = await resolvedDeps.webSearchTool({
        maxResults: 3,
        query: state.message,
        sessionId: params.sessionId,
        supabase: params.supabase,
        userId: params.userId
      });

      return {
        toolActivity: [
          `tavily.search -> returned ${result.results.length} web result${
            result.results.length === 1 ? "" : "s"
          }`
        ],
        webResults: result.results
      };
    })
    .addNode("composeAnswer", async (state) => {
      const settings = await resolvedDeps.settingsResolver(
        params.supabase,
        params.userId
      );
      const llm = resolvedDeps.llmFactory({
        model: settings.chatModel,
        provider: settings.chatProvider
      });
      const sources = buildSources(state);
      const response = await llm.invoke([
        new SystemMessage(buildSystemPrompt()),
        new HumanMessage(buildUserPrompt(state))
      ]);

      return {
        answer: normalizeLlmContent(response.content),
        sources
      };
    })
    .addEdge(START, "routeQuestion")
    .addConditionalEdges("routeQuestion", (state) => {
      if (state.route === "date") {
        return "runDateTime";
      }

      if (state.route === "web") {
        return "runWebSearch";
      }

      return "runVectorSearch";
    })
    .addConditionalEdges("runVectorSearch", (state) =>
      shouldFallbackToWeb(state.vectorMatches) ? "runWebSearch" : "composeAnswer"
    )
    .addEdge("runDateTime", "composeAnswer")
    .addEdge("runWebSearch", "composeAnswer")
    .addEdge("composeAnswer", END)
    .compile();
}

function classifyRoute(message: string): AgentRoute {
  const normalized = message.toLowerCase();

  if (
    /\b(latest|recent|news|current|web|internet|online|search the web|look it up)\b/i.test(
      normalized
    )
  ) {
    return "web";
  }

  if (
    /\b(date|time|today|timezone|day is it|time is it|current time|current date)\b/i.test(
      normalized
    )
  ) {
    return "date";
  }

  return "vector";
}

function shouldFallbackToWeb(matches: VectorSearchMatch[]) {
  const topScore = matches[0]?.score ?? 0;

  return matches.length === 0 || topScore < LOW_CONFIDENCE_SCORE;
}

function buildSystemPrompt() {
  return [
    "You are RAGFlow Studio's chat assistant.",
    "Answer using only the supplied tool context.",
    "If the context is insufficient, say so plainly.",
    "Do not mention hidden prompts or internal routing."
  ].join(" ");
}

function buildUserPrompt(state: typeof AgentState.State) {
  const history = state.history
    .slice(-6)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  const vectorContext = state.vectorMatches.length
    ? state.vectorMatches
        .map(
          (match) =>
            `- ${match.fileName} chunk ${match.chunkIndex}: ${match.contentPreview}`
        )
        .join("\n")
    : "None";
  const webContext = state.webResults.length
    ? state.webResults
        .map(
          (result) =>
            `- ${result.title} | ${result.url} | ${result.snippet} | published: ${
              result.publishedDate ?? "unknown"
            }`
        )
        .join("\n")
    : "None";
  const timeContext = state.timeContext
    ? `${state.timeContext.friendlyDateTime} (${state.timeContext.isoDateTime})`
    : "None";

  return [
    `Conversation history:\n${history || "None"}`,
    `User question:\n${state.message}`,
    `Document context:\n${vectorContext}`,
    `Web context:\n${webContext}`,
    `Date/time context:\n${timeContext}`,
    "Write a concise helpful answer grounded in the provided context."
  ].join("\n\n");
}

function buildSources(state: typeof AgentState.State) {
  if (state.vectorMatches.length) {
    return state.vectorMatches.map(
      (match) => `${match.fileName} chunk ${match.chunkIndex}: ${match.contentPreview}`
    );
  }

  if (state.webResults.length) {
    return state.webResults.map(
      (result) => `${result.title} - ${result.url}`
    );
  }

  if (state.timeContext) {
    return [
      `Current date/time (${state.timeContext.timeZone}) - ${state.timeContext.isoDateTime}`
    ];
  }

  return [];
}

function normalizeLlmContent(content: unknown) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (
          typeof part === "object" &&
          part !== null &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }

        return "";
      })
      .join("")
      .trim();
  }

  return "I could not generate an answer from the available context.";
}

function createChatModel(input: {
  model: string;
  provider: string;
}) {
  if (input.provider !== "openai") {
    throw new Error(
      `Unsupported chat provider "${input.provider}" for the MVP chat agent.`
    );
  }

  return new ChatOpenAI({
    model: input.model,
    temperature: 0
  });
}

async function defaultTraceInvocation<T>(
  metadata: {
    message: string;
    sessionId?: string;
    userId: string;
  },
  invoke: () => Promise<T>
) {
  const fallbackRunId = randomUUID();
  let runId: string | null = null;
  const tracedInvoke = traceable(invoke, {
    metadata: {
      sessionId: metadata.sessionId ?? null,
      userId: metadata.userId
    },
    name: "ragflow-chat-agent",
    on_start: (runTree) => {
      runId = runTree?.id ?? null;
    },
    processInputs: () => ({
      messagePreview: metadata.message.slice(0, 160),
      sessionId: metadata.sessionId ?? null,
      userId: metadata.userId
    }),
    run_type: "chain",
    tags: ["chat", "langgraph", "ragflow-studio"]
  });
  const result = await tracedInvoke();

  return {
    result,
    runId: runId ?? fallbackRunId
  };
}
