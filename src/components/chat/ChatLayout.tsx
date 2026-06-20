import { ChatComposer } from "./ChatComposer";
import { MessageList } from "./MessageList";
import { SessionList } from "./SessionList";
import { SourcePanel } from "./SourcePanel";
import { ToolActivityPanel } from "./ToolActivityPanel";
import { Card } from "@/components/ui/Card";

const sessions = [
  { id: "1", title: "Onboarding guide", updatedAt: "Updated 2m ago", active: true },
  { id: "2", title: "Policy FAQ", updatedAt: "Updated 1h ago" },
  { id: "3", title: "Contracts review", updatedAt: "Updated yesterday" }
];

const messages = [
  {
    id: "m1",
    role: "user" as const,
    content: "What does the policy say about approval flow?"
  },
  {
    id: "m2",
    role: "assistant" as const,
    content:
      "The current scaffold shows where the answer, sources, and tool activity will appear once retrieval is wired in.",
    sources: ["handbook.md chunk 4", "policy.txt chunk 1"]
  }
];

const tools = ["pinecone.query -> filtered by user namespace", "date.now -> deterministic server helper"];

const sources = [
  { title: "Indexed docs: 4", detail: "Each answer will list retrieved chunks here." },
  { title: "Trace posture", detail: "LangSmith run IDs and tool metadata plug into this panel later." }
];

export function ChatLayout() {
  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <SessionList sessions={sessions} />

      <Card
        eyebrow="Chat"
        title="Agentic RAG workspace"
        description="This MVP scaffold mirrors the target chat layout with placeholder session, message, source, and tool affordances."
      >
        <div className="space-y-6">
          <MessageList messages={messages} />
          <ChatComposer />
        </div>
      </Card>

      <div className="space-y-6">
        <SourcePanel sources={sources} />
        <ToolActivityPanel items={tools} />
      </div>
    </div>
  );
}
