import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChatMessage,
  ChatMessageMetadata,
  ChatSession
} from "@/components/chat/types";
import { parseChatSessionParams } from "@/lib/validations/chat";

type ChatSessionRow = {
  id: string;
  title: string;
  updated_at: string;
};

type ChatMessageRow = {
  content: string;
  created_at: string;
  id: string;
  metadata: ChatMessageMetadata | null;
  role: ChatMessage["role"];
  session_id: string;
};

type PersistChatExchangeParams = {
  assistant: {
    content: string;
    metadata?: ChatMessageMetadata;
  };
  message: string;
  sessionId?: string;
  supabase: SupabaseClient;
  userId: string;
};

export async function listChatSessions(
  supabase: SupabaseClient,
  userId: string
): Promise<ChatSession[]> {
  const [sessionsResult, messagesResult] = await Promise.all([
    supabase
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false }),
    supabase
      .from("chat_messages")
      .select("id, session_id, role, content, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
  ]);

  assertSupabaseSuccess(sessionsResult.error, "Unable to load chat sessions.");
  assertSupabaseSuccess(messagesResult.error, "Unable to load chat messages.");

  return mapSessionsWithMessages(
    (sessionsResult.data as ChatSessionRow[] | null) ?? [],
    (messagesResult.data as ChatMessageRow[] | null) ?? []
  );
}

export async function getChatSession(
  supabase: SupabaseClient,
  input: {
    sessionId?: string;
    userId: string;
  }
): Promise<ChatSession | null> {
  const { sessionId } = parseChatSessionParams({
    sessionId: input.sessionId
  });

  const [sessionResult, messagesResult] = await Promise.all([
    supabase
      .from("chat_sessions")
      .select("id, title, updated_at")
      .eq("id", sessionId)
      .eq("user_id", input.userId)
      .eq("is_archived", false)
      .maybeSingle(),
    supabase
      .from("chat_messages")
      .select("id, session_id, role, content, metadata, created_at")
      .eq("session_id", sessionId)
      .eq("user_id", input.userId)
      .order("created_at", { ascending: true })
  ]);

  assertSupabaseSuccess(sessionResult.error, "Unable to load the chat session.");
  assertSupabaseSuccess(messagesResult.error, "Unable to load the chat session messages.");

  const session = sessionResult.data as ChatSessionRow | null;

  if (!session) {
    return null;
  }

  return mapSessionsWithMessages(
    [session],
    (messagesResult.data as ChatMessageRow[] | null) ?? []
  )[0]!;
}

export async function persistChatExchange({
  assistant,
  message,
  sessionId,
  supabase,
  userId
}: PersistChatExchangeParams): Promise<ChatSession> {
  const resolvedSessionId = sessionId
    ? await ensureChatSessionExists(supabase, { sessionId, userId })
    : await createChatSession(supabase, {
        title: message.slice(0, 36),
        userId
      });

  const insertResult = await supabase
    .from("chat_messages")
    .insert([
      {
        content: message,
        metadata: {},
        role: "user",
        session_id: resolvedSessionId,
        user_id: userId
      },
      {
        content: assistant.content,
        metadata: assistant.metadata ?? {},
        role: "assistant",
        session_id: resolvedSessionId,
        user_id: userId
      }
    ])
    .select("id, session_id, role, content, metadata, created_at");

  assertSupabaseSuccess(insertResult.error, "Unable to save chat messages.");

  const updateResult = await supabase
    .from("chat_sessions")
    .update({
      title: message.slice(0, 36),
      updated_at: new Date().toISOString()
    })
    .eq("id", resolvedSessionId)
    .eq("user_id", userId);

  assertSupabaseSuccess(updateResult.error, "Unable to update the chat session.");

  const session = await getChatSession(supabase, {
    sessionId: resolvedSessionId,
    userId
  });

  if (!session) {
    throw new Error("The saved chat session could not be loaded.");
  }

  return session;
}

export function buildMockAssistantReply(message: string): {
  content: string;
  metadata: ChatMessageMetadata;
} {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes("approval")) {
    return {
      content:
        "Based on your indexed documents, approval requests should route to the document owner first, then move to a manager review before any external sharing happens.",
      metadata: {
        sources: ["employee-handbook.md chunk 4", "policy.txt chunk 2"],
        toolActivity: [
          "pinecone.query -> searched the authenticated user's namespace",
          "date.now -> added deterministic timestamp context"
        ]
      }
    };
  }

  if (normalized.includes("summarize")) {
    return {
      content:
        "Here is the short version from your indexed notes: the documents focus on approval flow, security guardrails, and the key handoff steps new teammates should follow.",
      metadata: {
        sources: ["handbook.md chunk 1", "policy.txt chunk 1"],
        toolActivity: ["pinecone.query -> searched the authenticated user's namespace"]
      }
    };
  }

  return {
    content:
      "I searched your private document context and found the most relevant chunks. Once retrieval is wired in, this stored response will be replaced by the backend agent output.",
    metadata: {
      sources: ["employee-handbook.md chunk 3"],
      toolActivity: ["pinecone.query -> searched the authenticated user's namespace"]
    }
  };
}

async function createChatSession(
  supabase: SupabaseClient,
  input: {
    title: string;
    userId: string;
  }
) {
  const result = await supabase
    .from("chat_sessions")
    .insert({
      title: input.title || "New chat",
      user_id: input.userId
    })
    .select("id")
    .single();

  assertSupabaseSuccess(result.error, "Unable to create a new chat session.");

  if (!result.data?.id) {
    throw new Error("The new chat session did not return an id.");
  }

  return result.data.id as string;
}

async function ensureChatSessionExists(
  supabase: SupabaseClient,
  input: {
    sessionId: string;
    userId: string;
  }
) {
  const session = await getChatSession(supabase, input);

  if (!session) {
    throw new Error("Chat session not found.");
  }

  return session.id;
}

function mapSessionsWithMessages(
  sessions: ChatSessionRow[],
  messages: ChatMessageRow[]
): ChatSession[] {
  const messagesBySessionId = new Map<string, ChatMessage[]>();

  for (const message of messages) {
    const list = messagesBySessionId.get(message.session_id) ?? [];
    list.push({
      content: message.content,
      id: message.id,
      ...(message.metadata &&
      (message.metadata.sources?.length || message.metadata.toolActivity?.length)
        ? { metadata: message.metadata }
        : {}),
      role: message.role
    });
    messagesBySessionId.set(message.session_id, list);
  }

  return sessions.map((session) => ({
    id: session.id,
    messages: messagesBySessionId.get(session.id) ?? [],
    title: session.title,
    updatedAt: formatSessionTimestamp(session.updated_at)
  }));
}

function formatSessionTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Updated recently";
  }

  return date.toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short"
  });
}

function assertSupabaseSuccess(error: { message?: string } | null, fallback: string) {
  if (error) {
    throw new Error(error.message || fallback);
  }
}
