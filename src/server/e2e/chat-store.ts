import { randomUUID } from "node:crypto";
import {
  buildDocumentChunkHref,
  type ChatMessageMetadata,
  type ChatSession
} from "@/components/chat/types";

type E2EChatState = {
  sessionsByStateId: Record<string, ChatSession[]>;
};

type E2ERoute = "date" | "vector" | "web";

const state: E2EChatState = {
  sessionsByStateId: {}
};

const FIXTURE_DOCUMENT = {
  chunkIndex: 0,
  contentPreview: "The launch city is Pune.",
  documentId: "fixture-doc-1",
  fileName: "team-facts.md",
  linkTarget: buildDocumentChunkHref("fixture-doc-1", 0),
  retrievalScore: 0.92,
  sourceType: "document" as const,
  title: "Chunk 1"
};
const FIXTURE_WEB_SOURCE = {
  chunkIndex: null,
  contentPreview: "The latest AI update says retrieval systems remain a major focus.",
  documentId: null,
  fileName: "Latest AI update",
  linkTarget: "https://example.com/latest-ai",
  retrievalScore: 0.88,
  sourceType: "web" as const,
  title: "Result 1"
};

export function resetE2EChatState(stateId = "default") {
  state.sessionsByStateId[stateId] = [];
}

export function listE2EChatSessions(stateId = "default") {
  return getSessions(stateId).map(cloneSession);
}

export function createE2EChatReply(input: {
  message: string;
  modelConfigId?: string | null;
  sessionId?: string;
  stateId?: string;
  thinkingLevel?: "high" | "low" | "medium";
}) {
  const stateId = input.stateId ?? "default";
  const route = classifyE2ERoute(input.message);
  const sessions = getSessions(stateId);
  const existingSession =
    input.sessionId
      ? sessions.find((session) => session.id === input.sessionId)
      : undefined;

  const session =
    existingSession ??
    {
      id: randomUUID(),
      messages: [],
      modelConfigId: null,
      thinkingLevel: "medium",
      title: input.message.slice(0, 36) || "New chat",
      updatedAt: "Just now"
    };

  session.messages.push({
    content: input.message,
    id: randomUUID(),
    modelConfigId: input.modelConfigId ?? null,
    role: "user",
    thinkingLevel: input.thinkingLevel ?? "medium"
  });

  session.messages.push({
    content: answerQuestion(input.message, route),
    id: randomUUID(),
    metadata: buildMetadata(route),
    modelConfigId: input.modelConfigId ?? null,
    role: "assistant",
    thinkingLevel: input.thinkingLevel ?? "medium"
  });

  session.modelConfigId = input.modelConfigId ?? null;
  session.thinkingLevel = input.thinkingLevel ?? "medium";
  session.title = input.message.slice(0, 36) || session.title;
  session.updatedAt = "Just now";

  if (!existingSession) {
    state.sessionsByStateId[stateId] = [session, ...sessions];
  } else {
    state.sessionsByStateId[stateId] = [
      session,
      ...sessions.filter((candidate) => candidate.id !== session.id)
    ];
  }

  return cloneSession(session);
}

function getSessions(stateId: string) {
  return state.sessionsByStateId[stateId] ?? [];
}

function answerQuestion(message: string, route: E2ERoute) {
  const normalizedMessage = message.toLowerCase();

  if (route === "date") {
    return "The current date is June 23, 2026, and the current time is 12:00 PM UTC.";
  }

  if (route === "web") {
    return "The latest AI update in this fixture says retrieval systems remain a major focus.";
  }

  if (
    normalizedMessage.includes("launch city") ||
    normalizedMessage.includes("city") ||
    normalizedMessage.includes("pune")
  ) {
    return "The launch city is Pune.";
  }

  return "According to team-facts.md, the launch city is Pune.";
}

function buildMetadata(route: E2ERoute): ChatMessageMetadata {
  if (route === "date") {
    return {
      citations: [
        {
          chunkIndex: null,
          contentPreview: "June 23, 2026 at 12:00 PM UTC",
          documentId: null,
          fileName: "Current date/time (UTC)",
          linkTarget: null,
          retrievalScore: null,
          sourceType: "date_time",
          title: "2026-06-23T12:00:00.000Z"
        }
      ],
      reasoning: [
        {
          detail: "Resolved the current UTC time context for the answer.",
          id: "date-time",
          label: "Resolve time",
          status: "completed"
        }
      ],
      toolActivity: ["date.now -> resolved UTC time context"]
    };
  }

  if (route === "web") {
    return {
      citations: [FIXTURE_WEB_SOURCE],
      reasoning: [
        {
          detail: "Collected one web result for the answer.",
          id: "web-search",
          label: "Search web",
          status: "completed"
        }
      ],
      toolActivity: ["tavily.search -> returned 1 web result"]
    };
  }

  return {
    citations: [FIXTURE_DOCUMENT],
    reasoning: [
      {
        detail: "Retrieved one document chunk from the authenticated user's namespace.",
        id: "vector-search",
        label: "Retrieve",
        status: "completed"
      }
    ],
    toolActivity: ["pinecone.query -> returned 1 document chunk"]
  };
}

function classifyE2ERoute(message: string): E2ERoute {
  const normalizedMessage = message.toLowerCase();

  if (
    /\b(latest|recent|news|current|web|internet|online|search the web|look it up)\b/i.test(
      normalizedMessage
    )
  ) {
    return "web";
  }

  if (
    /\b(date|time|today|timezone|day is it|time is it|current time|current date)\b/i.test(
      normalizedMessage
    )
  ) {
    return "date";
  }

  return "vector";
}

function cloneSession(session: ChatSession): ChatSession {
  return {
    ...session,
    messages: session.messages.map((message) => ({
      ...message,
      ...(message.metadata
        ? {
            metadata: {
              ...message.metadata,
              ...(message.metadata.citations
                ? { citations: [...message.metadata.citations] }
                : {}),
              ...(message.metadata.reasoning
                ? { reasoning: [...message.metadata.reasoning] }
                : {}),
              ...(message.metadata.toolActivity
                ? { toolActivity: [...message.metadata.toolActivity] }
                : {})
            }
          }
        : {})
    }))
  };
}
