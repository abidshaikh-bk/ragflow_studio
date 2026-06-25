export type ThinkingLevel = "high" | "low" | "medium";

export type ChatCitation = {
  chunkIndex: number | null;
  contentPreview: string;
  documentId: string | null;
  fileName: string;
  linkTarget: string | null;
  pageNumber?: number | null;
  retrievalScore?: number | null;
  sourceType: "date_time" | "document" | "runtime_mcp" | "web";
  title?: string | null;
};

export type ChatReasoningStep = {
  detail: string;
  id: string;
  label: string;
  status: "completed";
};

export type ChatModelOption = {
  defaultThinkingLevel: ThinkingLevel;
  id: string | null;
  isDefault: boolean;
  label: string;
  modelName: string;
  provider: string;
  supportsThinking: boolean;
};

export type ChatModelSnapshot = {
  label: string;
  modelName: string;
  provider: string;
};

export type ChatMessageMetadata = {
  citations?: ChatCitation[];
  langsmithRunId?: string | null;
  reasoning?: ChatReasoningStep[];
  sources?: string[];
  toolActivity?: string[];
};

export type ChatMessage = {
  content: string;
  id: string;
  metadata?: ChatMessageMetadata;
  modelConfigId?: string | null;
  modelSnapshot?: ChatModelSnapshot;
  role: "assistant" | "system" | "tool" | "user";
  thinkingLevel?: ThinkingLevel | null;
};

export type ChatSession = {
  id: string;
  messages: ChatMessage[];
  modelConfigId?: string | null;
  thinkingLevel?: ThinkingLevel;
  title: string;
  updatedAt: string;
};

export function buildDocumentChunkHref(documentId: string, chunkIndex: number) {
  return `/documents/${documentId}#chunk-${chunkIndex + 1}`;
}

export function normalizeChatMessageMetadata(
  metadata?: ChatMessageMetadata | null
): ChatMessageMetadata | undefined {
  if (!metadata) {
    return undefined;
  }

  const citations =
    metadata.citations?.length
      ? metadata.citations
      : metadata.sources?.map((source) => ({
          chunkIndex: null,
          contentPreview: source,
          documentId: null,
          fileName: source,
          linkTarget: null,
          sourceType: "document" as const,
          title: source
        }));

  if (
    !citations?.length &&
    !metadata.reasoning?.length &&
    !metadata.toolActivity?.length &&
    !metadata.langsmithRunId
  ) {
    return undefined;
  }

  return {
    ...(citations?.length ? { citations } : {}),
    ...(metadata.langsmithRunId
      ? {
          langsmithRunId: metadata.langsmithRunId
        }
      : {}),
    ...(metadata.reasoning?.length
      ? {
          reasoning: metadata.reasoning
        }
      : {}),
    ...(metadata.toolActivity?.length
      ? {
          toolActivity: metadata.toolActivity
        }
      : {})
  };
}
