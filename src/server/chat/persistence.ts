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
  langsmith_run_id: string | null;
  metadata: ChatMessageMetadata | null;
  role: ChatMessage["role"];
  session_id: string;
};

type PrepareChatTurnParams = {
  message: string;
  sessionId?: string;
  supabase: SupabaseClient;
  userId: string;
};

type PersistAssistantReplyParams = {
  assistant: {
    content: string;
    langsmithRunId?: string | null;
    metadata?: ChatMessageMetadata;
  };
  sessionId: string;
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
      .select("id, session_id, role, content, metadata, langsmith_run_id, created_at")
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
      .select("id, session_id, role, content, metadata, langsmith_run_id, created_at")
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

export async function prepareChatTurn({
  message,
  sessionId,
  supabase,
  userId
}: PrepareChatTurnParams) {
  const resolvedSessionId = sessionId
    ? await ensureChatSessionExists(supabase, { sessionId, userId })
    : await createChatSession(supabase, {
        title: message.slice(0, 36),
        userId
      });

  const insertResult = await supabase
    .from("chat_messages")
    .insert({
      content: message,
      metadata: {},
      role: "user",
      session_id: resolvedSessionId,
      user_id: userId
    })
    .select("id")
    .single();

  assertSupabaseSuccess(insertResult.error, "Unable to save the user chat message.");

  await updateChatSessionTimestamp(supabase, {
    sessionId: resolvedSessionId,
    title: message.slice(0, 36),
    userId
  });

  return {
    messageId: insertResult.data?.id as string | undefined,
    sessionId: resolvedSessionId
  };
}

export async function persistAssistantReply({
  assistant,
  sessionId,
  supabase,
  userId
}: PersistAssistantReplyParams): Promise<ChatSession> {
  const insertResult = await supabase
    .from("chat_messages")
    .insert({
      content: assistant.content,
      langsmith_run_id: assistant.langsmithRunId ?? null,
      metadata: assistant.metadata ?? {},
      role: "assistant",
      session_id: sessionId,
      user_id: userId
    })
    .select("id")
    .single();

  assertSupabaseSuccess(insertResult.error, "Unable to save the assistant reply.");

  await updateChatSessionTimestamp(supabase, {
    sessionId,
    title: assistant.content.slice(0, 36),
    userId
  });

  const session = await getChatSession(supabase, {
    sessionId,
    userId
  });

  if (!session) {
    throw new Error("The saved chat session could not be loaded.");
  }

  return session;
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

async function updateChatSessionTimestamp(
  supabase: SupabaseClient,
  input: {
    sessionId: string;
    title: string;
    userId: string;
  }
) {
  const updateResult = await supabase
    .from("chat_sessions")
    .update({
      title: input.title || "New chat",
      updated_at: new Date().toISOString()
    })
    .eq("id", input.sessionId)
    .eq("user_id", input.userId);

  assertSupabaseSuccess(updateResult.error, "Unable to update the chat session.");
}

function mapSessionsWithMessages(
  sessions: ChatSessionRow[],
  messages: ChatMessageRow[]
): ChatSession[] {
  const messagesBySessionId = new Map<string, ChatMessage[]>();

  for (const message of messages) {
    const list = messagesBySessionId.get(message.session_id) ?? [];
    const metadata = message.metadata ?? {};

    list.push({
      content: message.content,
      id: message.id,
      ...((metadata.sources?.length ||
        metadata.toolActivity?.length ||
        message.langsmith_run_id) && {
        metadata: {
          ...metadata,
          ...(message.langsmith_run_id
            ? {
                langsmithRunId: message.langsmith_run_id
              }
            : {})
        }
      }),
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
