import { ProtectedPagePlaceholder } from "@/components/app-shell/ProtectedPagePlaceholder";

export default function ChatPage() {
  return (
    <ProtectedPagePlaceholder
      description="The shell, navigation, and protected workspace frame are in place. The next task can focus on wiring in the chat-specific layout and data flow."
      eyebrow="Chat"
      title="Agentic RAG chat workspace"
    />
  );
}
