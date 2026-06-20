import { MessageBubble } from "./MessageBubble";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

type MessageListProps = {
  messages: Message[];
};

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble
          content={message.content}
          key={message.id}
          role={message.role}
          sources={message.sources}
        />
      ))}
    </div>
  );
}
