import { MessageBubble } from "./MessageBubble";
import type { ChatMessage } from "./types";
import { EmptyState } from "@/components/ui/EmptyState";

type MessageListProps = {
  loading?: boolean;
  messages: ChatMessage[];
};

export function MessageList({ loading = false, messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <EmptyState
        title="Ask your knowledge base"
        description="Upload documents, then ask questions about your private data. Suggested prompt: Summarize my documents."
      />
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble
          content={message.content}
          citations={message.metadata?.citations}
          key={message.id}
          role={message.role}
        />
      ))}
      {loading ? (
        <MessageBubble
          content="Searching your documents and preparing an answer..."
          role="assistant"
        />
      ) : null}
    </div>
  );
}
