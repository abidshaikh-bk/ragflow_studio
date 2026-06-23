import { randomUUID } from "node:crypto";
import type { ChatSession } from "@/components/chat/types";

type E2EChatState = {
  sessions: ChatSession[];
};

type E2ERoute = "date" | "vector" | "web";

const state: E2EChatState = {
  sessions: []
};

const FIXTURE_DOCUMENT = "team-facts.md chunk 1";
const FIXTURE_WEB_SOURCE = "Latest AI update - https://example.com/latest-ai";

export function resetE2EChatState() {
  state.sessions = [];
}

export function listE2EChatSessions() {
  return state.sessions.map(cloneSession);
}

export function createE2EChatReply(input: { message: string; sessionId?: string }) {
  const route = classifyE2ERoute(input.message);
  const existingSession =
    input.sessionId
      ? state.sessions.find((session) => session.id === input.sessionId)
      : undefined;

  const session =
    existingSession ??
    {
      id: randomUUID(),
      messages: [],
      title: input.message.slice(0, 36) || "New chat",
      updatedAt: "Just now"
    };

  session.messages.push({
    content: input.message,
    id: randomUUID(),
    role: "user"
  });

  session.messages.push({
    content: answerQuestion(input.message, route),
    id: randomUUID(),
    metadata: buildMetadata(route),
    role: "assistant"
  });

  session.title = input.message.slice(0, 36) || session.title;
  session.updatedAt = "Just now";

  if (!existingSession) {
    state.sessions = [session, ...state.sessions];
  } else {
    state.sessions = [
      session,
      ...state.sessions.filter((candidate) => candidate.id !== session.id)
    ];
  }

  return cloneSession(session);
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

function buildMetadata(route: E2ERoute) {
  if (route === "date") {
    return {
      toolActivity: ["date.now -> resolved UTC time context"]
    };
  }

  if (route === "web") {
    return {
      sources: [FIXTURE_WEB_SOURCE],
      toolActivity: ["tavily.search -> returned 1 web result"]
    };
  }

  return {
    sources: [FIXTURE_DOCUMENT],
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
              ...(message.metadata.sources
                ? { sources: [...message.metadata.sources] }
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
