import type { ChatMessageMetadata } from "@/components/chat/types";

export type HistoryRunStatus = "completed" | "failed" | "in_progress";

export type HistoryTrace = {
  deepLink: string | null;
  runId: string;
  source: "assistant_message" | "built_in_tool" | "runtime_mcp_tool";
};

export type HistoryToolActivity = {
  createdAt: string;
  id: string;
  langsmithRunId: string | null;
  latencyMs: number | null;
  source: "built_in" | "runtime_mcp";
  status: string;
  summary: string;
  toolName: string;
};

export type HistoryMessage = {
  content: string;
  createdAt: string;
  id: string;
  langsmithRunId: string | null;
  metadata?: ChatMessageMetadata | null;
  role: "assistant" | "system" | "tool" | "user";
};

export type HistoryRunSummary = {
  assistantReply: string | null;
  hasRuntimeMcpActivity: boolean;
  sessionId: string;
  status: HistoryRunStatus;
  title: string;
  toolActivityCount: number;
  toolNames: string[];
  trace: HistoryTrace | null;
  updatedAt: string;
  userPrompt: string | null;
};

export type HistoryRunDetail = HistoryRunSummary & {
  messages: HistoryMessage[];
  toolActivity: HistoryToolActivity[];
};
