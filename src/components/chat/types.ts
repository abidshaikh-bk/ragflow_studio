export type ChatMessageMetadata = {
  sources?: string[];
  toolActivity?: string[];
};

export type ChatMessage = {
  content: string;
  id: string;
  metadata?: ChatMessageMetadata;
  role: "assistant" | "system" | "tool" | "user";
};

export type ChatSession = {
  id: string;
  messages: ChatMessage[];
  title: string;
  updatedAt: string;
};
