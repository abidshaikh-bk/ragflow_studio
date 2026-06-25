import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChatMessage,
  ChatModelSnapshot,
  ChatMessageMetadata,
  ChatSession,
  ThinkingLevel
} from "@/components/chat/types";
import { normalizeChatMessageMetadata } from "@/components/chat/types";
import { parseChatSessionParams } from "@/lib/validations/chat";

type ChatSessionRow = {
  id: string;
  model_config_id: string | null;
  thinking_level: ThinkingLevel;
  title: string;
  updated_at: string;
};

type ChatMessageRow = {
  content: string;
  created_at: string;
  id: string;
  langsmith_run_id: string | null;
  metadata: ChatMessageMetadata | null;
  model_config_id: string | null;
  model_snapshot: ChatModelSnapshot | null;
  role: ChatMessage["role"];
  session_id: string;
  thinking_level: ThinkingLevel | null;
};

type PersistedChatSelection = {
  modelConfigId: string | null;
  modelSnapshot: ChatModelSnapshot;
  thinkingLevel: ThinkingLevel;
};

type PrepareChatTurnParams = {
  message: string;
  modelConfigId: string | null;
  modelSnapshot: ChatModelSnapshot;
  sessionId?: string;
  supabase: SupabaseClient;
  thinkingLevel: ThinkingLevel;
  userId: string;
};

type PersistAssistantReplyParams = {
  assistant: {
    content: string;
    langsmithRunId?: string | null;
    metadata?: ChatMessageMetadata;
  };
  modelConfigId: string | null;
  modelSnapshot: ChatModelSnapshot;
  sessionId: string;
  supabase: SupabaseClient;
  thinkingLevel: ThinkingLevel;
  userId: string;
};

export async function listChatSessions(
  supabase: SupabaseClient,
  userId: string
): Promise<ChatSession[]> {
  const [sessionsResult, messagesResult] = await Promise.all([
    supabase
      .from("chat_sessions")
      .select("id, title, updated_at, model_config_id, thinking_level")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false }),
    supabase
      .from("chat_messages")
      .select(
        "id, session_id, role, content, metadata, langsmith_run_id, created_at, model_config_id, model_snapshot, thinking_level"
      )
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
      .select("id, title, updated_at, model_config_id, thinking_level")
      .eq("id", sessionId)
      .eq("user_id", input.userId)
      .eq("is_archived", false)
      .maybeSingle(),
    supabase
      .from("chat_messages")
      .select(
        "id, session_id, role, content, metadata, langsmith_run_id, created_at, model_config_id, model_snapshot, thinking_level"
      )
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
  modelConfigId,
  modelSnapshot,
  sessionId,
  supabase,
  thinkingLevel,
  userId
}: PrepareChatTurnParams) {
  const resolvedSessionId = sessionId
    ? await ensureChatSessionExists(supabase, { sessionId, userId })
    : await createChatSession(supabase, {
        modelConfigId,
        thinkingLevel,
        title: message.slice(0, 36),
        userId
      });

  const insertResult = await supabase
    .from("chat_messages")
    .insert({
      content: message,
      metadata: {},
      model_config_id: modelConfigId,
      model_snapshot: modelSnapshot,
      role: "user",
      session_id: resolvedSessionId,
      thinking_level: thinkingLevel,
      user_id: userId
    })
    .select("id")
    .single();

  assertSupabaseSuccess(insertResult.error, "Unable to save the user chat message.");

  await updateChatSessionTimestamp(supabase, {
    modelConfigId,
    sessionId: resolvedSessionId,
    thinkingLevel,
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
  modelConfigId,
  modelSnapshot,
  sessionId,
  supabase,
  thinkingLevel,
  userId
}: PersistAssistantReplyParams): Promise<ChatSession> {
  const insertResult = await supabase
    .from("chat_messages")
    .insert({
      content: assistant.content,
      langsmith_run_id: assistant.langsmithRunId ?? null,
      metadata: normalizePersistedAssistantMetadata(assistant.metadata),
      model_config_id: modelConfigId,
      model_snapshot: modelSnapshot,
      role: "assistant",
      session_id: sessionId,
      thinking_level: thinkingLevel,
      user_id: userId
    })
    .select("id")
    .single();

  assertSupabaseSuccess(insertResult.error, "Unable to save the assistant reply.");

  await updateChatSessionTimestamp(supabase, {
    modelConfigId,
    sessionId,
    thinkingLevel,
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
    modelConfigId: string | null;
    thinkingLevel: ThinkingLevel;
    title: string;
    userId: string;
  }
) {
  const result = await supabase
    .from("chat_sessions")
    .insert({
      model_config_id: input.modelConfigId,
      thinking_level: input.thinkingLevel,
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
    modelConfigId: string | null;
    sessionId: string;
    thinkingLevel: ThinkingLevel;
    title: string;
    userId: string;
  }
) {
  const updateResult = await supabase
    .from("chat_sessions")
    .update({
      model_config_id: input.modelConfigId,
      thinking_level: input.thinkingLevel,
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
    const metadata = normalizeChatMessageMetadata(message.metadata ?? undefined);

    list.push({
      content: message.content,
      id: message.id,
      ...(message.model_config_id !== undefined
        ? {
            modelConfigId: message.model_config_id
          }
        : {}),
      ...(message.model_snapshot
        ? {
            modelSnapshot: message.model_snapshot
          }
        : {}),
      ...((metadata?.citations?.length ||
        metadata?.reasoning?.length ||
        metadata?.toolActivity?.length ||
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
      role: message.role,
      ...(message.thinking_level
        ? {
            thinkingLevel: message.thinking_level
          }
        : {})
    });
    messagesBySessionId.set(message.session_id, list);
  }

  return sessions.map((session) => ({
    id: session.id,
    messages: messagesBySessionId.get(session.id) ?? [],
    modelConfigId: session.model_config_id,
    thinkingLevel: session.thinking_level,
    title: session.title,
    updatedAt: formatSessionTimestamp(session.updated_at)
  }));
}

export function normalizePersistedAssistantMetadata(
  metadata?: ChatMessageMetadata
): ChatMessageMetadata {
  return normalizeChatMessageMetadata(metadata) ?? {};
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
