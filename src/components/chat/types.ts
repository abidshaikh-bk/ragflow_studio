export type ThinkingLevel = "high" | "low" | "medium";

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
  langsmithRunId?: string | null;
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
