import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  HistoryMessage,
  HistoryRunDetail,
  HistoryRunStatus,
  HistoryRunSummary,
  HistoryToolActivity,
  HistoryTrace
} from "@/components/history/types";
import {
  normalizeChatMessageMetadata,
  type ChatMessageMetadata
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
  role: HistoryMessage["role"];
  session_id: string;
};

type AgentToolCallRow = {
  created_at: string;
  id: string;
  langsmith_run_id: string | null;
  latency_ms: number | null;
  session_id: string;
  status: string;
  tool_name: string;
  tool_output: unknown;
};

type McpToolInvocationRow = {
  created_at: string;
  error_message: string | null;
  id: string;
  langsmith_run_id: string | null;
  latency_ms: number | null;
  session_id: string | null;
  status: string;
  tool_name: string;
  tool_output_preview: unknown;
};

export async function listHistoryRuns(
  supabase: SupabaseClient,
  userId: string
): Promise<HistoryRunSummary[]> {
  const [sessionsResult, messagesResult, builtInToolsResult, runtimeToolsResult] =
    await Promise.all([
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
        .order("created_at", { ascending: true }),
      supabase
        .from("agent_tool_calls")
        .select("id, session_id, tool_name, status, latency_ms, langsmith_run_id, created_at, tool_output")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("mcp_tool_invocations")
        .select(
          "id, session_id, tool_name, status, latency_ms, error_message, langsmith_run_id, created_at, tool_output_preview"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
    ]);

  assertSupabaseSuccess(sessionsResult.error, "Unable to load the history sessions.");
  assertSupabaseSuccess(messagesResult.error, "Unable to load the history messages.");
  assertSupabaseSuccess(
    builtInToolsResult.error,
    "Unable to load the built-in tool history."
  );
  assertSupabaseSuccess(
    runtimeToolsResult.error,
    "Unable to load the runtime MCP tool history."
  );

  const messagesBySession = groupBySessionId(
    (messagesResult.data as ChatMessageRow[] | null) ?? []
  );
  const builtInToolsBySession = groupBySessionId(
    (builtInToolsResult.data as AgentToolCallRow[] | null) ?? []
  );
  const runtimeToolsBySession = groupBySessionId(
    ((runtimeToolsResult.data as McpToolInvocationRow[] | null) ?? []).filter(
      (row): row is McpToolInvocationRow & { session_id: string } =>
        typeof row.session_id === "string"
    )
  );

  return ((sessionsResult.data as ChatSessionRow[] | null) ?? []).map((session) =>
    toHistoryRunSummary(
      buildHistoryRunDetail(
        session,
        messagesBySession.get(session.id) ?? [],
        builtInToolsBySession.get(session.id) ?? [],
        runtimeToolsBySession.get(session.id) ?? []
      )
    )
  );
}

export async function getHistoryRun(
  supabase: SupabaseClient,
  input: {
    sessionId?: string;
    userId: string;
  }
): Promise<HistoryRunDetail | null> {
  const { sessionId } = parseChatSessionParams({
    sessionId: input.sessionId
  });

  const [sessionResult, messagesResult, builtInToolsResult, runtimeToolsResult] =
    await Promise.all([
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
        .order("created_at", { ascending: true }),
      supabase
        .from("agent_tool_calls")
        .select("id, session_id, tool_name, status, latency_ms, langsmith_run_id, created_at, tool_output")
        .eq("session_id", sessionId)
        .eq("user_id", input.userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("mcp_tool_invocations")
        .select(
          "id, session_id, tool_name, status, latency_ms, error_message, langsmith_run_id, created_at, tool_output_preview"
        )
        .eq("session_id", sessionId)
        .eq("user_id", input.userId)
        .order("created_at", { ascending: true })
    ]);

  assertSupabaseSuccess(sessionResult.error, "Unable to load the history session.");
  assertSupabaseSuccess(messagesResult.error, "Unable to load the history messages.");
  assertSupabaseSuccess(
    builtInToolsResult.error,
    "Unable to load the built-in tool history."
  );
  assertSupabaseSuccess(
    runtimeToolsResult.error,
    "Unable to load the runtime MCP tool history."
  );

  const session = sessionResult.data as ChatSessionRow | null;

  if (!session) {
    return null;
  }

  return buildHistoryRunDetail(
    session,
    (messagesResult.data as ChatMessageRow[] | null) ?? [],
    (builtInToolsResult.data as AgentToolCallRow[] | null) ?? [],
    ((runtimeToolsResult.data as McpToolInvocationRow[] | null) ?? []).filter(
      (row): row is McpToolInvocationRow & { session_id: string } =>
        typeof row.session_id === "string"
    )
  );
}

function buildHistoryRunDetail(
  session: ChatSessionRow,
  messages: ChatMessageRow[],
  builtInTools: AgentToolCallRow[],
  runtimeTools: Array<McpToolInvocationRow & { session_id: string }>
): HistoryRunDetail {
  const normalizedMessages = messages.map((message) => ({
    content: message.content,
    createdAt: message.created_at,
    id: message.id,
    langsmithRunId: message.langsmith_run_id,
    metadata: normalizeChatMessageMetadata(message.metadata),
    role: message.role
  }));
  const toolActivity = [
    ...builtInTools.map(normalizeBuiltInToolActivity),
    ...runtimeTools.map(normalizeRuntimeToolActivity)
  ].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const latestUserMessage = [...normalizedMessages]
    .reverse()
    .find((message) => message.role === "user");
  const latestAssistantMessage = [...normalizedMessages]
    .reverse()
    .find((message) => message.role === "assistant");

  return {
    assistantReply: latestAssistantMessage?.content ?? null,
    hasRuntimeMcpActivity: toolActivity.some((item) => item.source === "runtime_mcp"),
    messages: normalizedMessages,
    sessionId: session.id,
    status: deriveRunStatus(toolActivity, latestAssistantMessage),
    title: session.title,
    toolActivity,
    toolActivityCount: toolActivity.length,
    toolNames: Array.from(new Set(toolActivity.map((item) => item.toolName))),
    trace: deriveHistoryTrace(latestAssistantMessage, toolActivity),
    updatedAt: session.updated_at,
    userPrompt: latestUserMessage?.content ?? null
  };
}

function toHistoryRunSummary(detail: HistoryRunDetail): HistoryRunSummary {
  return {
    assistantReply: detail.assistantReply,
    hasRuntimeMcpActivity: detail.hasRuntimeMcpActivity,
    sessionId: detail.sessionId,
    status: detail.status,
    title: detail.title,
    toolActivityCount: detail.toolActivityCount,
    toolNames: detail.toolNames,
    trace: detail.trace,
    updatedAt: detail.updatedAt,
    userPrompt: detail.userPrompt
  };
}

function normalizeBuiltInToolActivity(row: AgentToolCallRow): HistoryToolActivity {
  return {
    createdAt: row.created_at,
    id: row.id,
    langsmithRunId: row.langsmith_run_id,
    latencyMs: row.latency_ms,
    source: "built_in",
    status: row.status,
    summary: summarizeToolPayload(row.tool_output),
    toolName: row.tool_name
  };
}

function normalizeRuntimeToolActivity(
  row: McpToolInvocationRow & { session_id: string }
): HistoryToolActivity {
  return {
    createdAt: row.created_at,
    id: row.id,
    langsmithRunId: row.langsmith_run_id,
    latencyMs: row.latency_ms,
    source: "runtime_mcp",
    status: row.status,
    summary: row.error_message || summarizeToolPayload(row.tool_output_preview),
    toolName: row.tool_name
  };
}

function deriveRunStatus(
  toolActivity: HistoryToolActivity[],
  latestAssistantMessage?: HistoryMessage
): HistoryRunStatus {
  if (toolActivity.some((item) => item.status === "failed")) {
    return "failed";
  }

  if (latestAssistantMessage) {
    return "completed";
  }

  return "in_progress";
}

function deriveHistoryTrace(
  latestAssistantMessage: HistoryMessage | undefined,
  toolActivity: HistoryToolActivity[]
): HistoryTrace | null {
  if (latestAssistantMessage?.langsmithRunId) {
    return {
      deepLink: null,
      runId: latestAssistantMessage.langsmithRunId,
      source: "assistant_message"
    };
  }

  const runtimeTrace = [...toolActivity]
    .reverse()
    .find((item) => item.source === "runtime_mcp" && item.langsmithRunId);

  if (runtimeTrace?.langsmithRunId) {
    return {
      deepLink: null,
      runId: runtimeTrace.langsmithRunId,
      source: "runtime_mcp_tool"
    };
  }

  const builtInTrace = [...toolActivity]
    .reverse()
    .find((item) => item.source === "built_in" && item.langsmithRunId);

  if (builtInTrace?.langsmithRunId) {
    return {
      deepLink: null,
      runId: builtInTrace.langsmithRunId,
      source: "built_in_tool"
    };
  }

  return null;
}

function summarizeToolPayload(value: unknown) {
  if (typeof value === "string") {
    return value.trim().slice(0, 160) || "Tool returned a string response.";
  }

  if (Array.isArray(value)) {
    return value.length
      ? `Returned ${value.length} item${value.length === 1 ? "" : "s"}.`
      : "Returned an empty list.";
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (typeof record.error === "string" && record.error.trim()) {
      return record.error.trim().slice(0, 160);
    }

    if (typeof record.preview === "string" && record.preview.trim()) {
      return record.preview.trim().slice(0, 160);
    }

    if (typeof record.friendlyDateTime === "string" && record.friendlyDateTime.trim()) {
      return record.friendlyDateTime.trim().slice(0, 160);
    }

    if (typeof record.snippet === "string" && record.snippet.trim()) {
      return record.snippet.trim().slice(0, 160);
    }

    const serialized = JSON.stringify(record);

    if (serialized && serialized !== "{}") {
      return serialized.slice(0, 160);
    }
  }

  return "Tool completed without a preview payload.";
}

function groupBySessionId<T extends { session_id: string }>(rows: T[]) {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const existingRows = grouped.get(row.session_id);

    if (existingRows) {
      existingRows.push(row);
      continue;
    }

    grouped.set(row.session_id, [row]);
  }

  return grouped;
}

function assertSupabaseSuccess(error: { message: string } | null, fallbackMessage: string) {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}
