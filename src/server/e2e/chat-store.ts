import { randomUUID } from "node:crypto";
import type { ChatSession } from "@/components/chat/types";

type E2EChatState = {
  sessions: ChatSession[];
};

const state: E2EChatState = {
  sessions: []
};

const FIXTURE_DOCUMENT = "team-facts.md chunk 1";
const FIXTURE_TOOL_ACTIVITY =
  "pinecone.query -> returned 1 document chunk";

export function resetE2EChatState() {
  state.sessions = [];
}

export function listE2EChatSessions() {
  return state.sessions.map(cloneSession);
}

export function createE2EChatReply(input: { message: string; sessionId?: string }) {
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
    content: answerQuestion(input.message),
    id: randomUUID(),
    metadata: {
      sources: [FIXTURE_DOCUMENT],
      toolActivity: [FIXTURE_TOOL_ACTIVITY]
    },
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

function answerQuestion(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("launch city") ||
    normalizedMessage.includes("city") ||
    normalizedMessage.includes("pune")
  ) {
    return "The launch city is Pune.";
  }

  return "According to team-facts.md, the launch city is Pune.";
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
