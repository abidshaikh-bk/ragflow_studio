"use client";

import { startTransition, useState } from "react";
import { ChatComposer } from "./ChatComposer";
import { MessageList } from "./MessageList";
import { SessionList } from "./SessionList";
import { SourcePanel } from "./SourcePanel";
import { ToolActivityPanel } from "./ToolActivityPanel";
import type { ChatSession } from "./types";
import { Card } from "@/components/ui/Card";

type ChatApiResponse = {
  data?: ChatSession;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

type SourceSummary = {
  detail: string;
  title: string;
};

const defaultModelLabel = "Default server model";
const defaultThinkingLabel = "Default";

function getAssistantMessageMetadata(messages: ChatSession["messages"]) {
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  return {
    sources:
      latestAssistantMessage?.metadata?.sources?.map((source, index) => ({
        detail:
          index === 0
            ? "Latest retrieval source shown for this answer."
            : "Additional supporting source returned with the assistant response.",
        title: source
      })) ?? [],
    toolActivity: latestAssistantMessage?.metadata?.toolActivity ?? []
  };
}

export function ChatLayout({
  initialSessions
}: {
  initialSessions: ChatSession[];
}) {
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessions[0]?.id ?? null
  );
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [hasCompletedDocuments] = useState(true);

  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? null;
  const activeMessages = activeSession?.messages ?? [];
  const activeMetadata = getAssistantMessageMetadata(activeMessages);

  function upsertSession(session: ChatSession) {
    setSessions((currentSessions) => {
      const filteredSessions = currentSessions.filter(
        (currentSession) => currentSession.id !== session.id
      );

      return [session, ...filteredSessions];
    });
  }

  function handleNewChat() {
    setActiveSessionId(null);
    setChatError("");
  }

  async function handleSubmit(message: string) {
    setLoading(true);
    setChatError("");

    try {
      const response = await fetch("/api/chat", {
        body: JSON.stringify({
          message,
          ...(activeSessionId ? { sessionId: activeSessionId } : {})
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json()) as ChatApiResponse;

      if (!response.ok || !payload.data) {
        const fieldMessage = payload.fieldErrors?.message?.[0];

        throw new Error(
          fieldMessage || payload.error || "Unable to save your chat message."
        );
      }

      startTransition(() => {
        upsertSession(payload.data!);
        setActiveSessionId(payload.data!.id);
      });
    } catch (error) {
      setChatError(
        error instanceof Error
          ? error.message
          : "Unable to save your chat message."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <SessionList
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelect={setActiveSessionId}
        sessions={sessions.map((session) => ({
          id: session.id,
          title: session.title,
          updatedAt: session.updatedAt
        }))}
      />

      <Card
        className="overflow-hidden"
        eyebrow="Conversation"
        title="Private document chat"
        description="Ask questions about your indexed documents while keeping retrieval and tool activity visible alongside the active thread."
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-400">
            <span>Model: {defaultModelLabel}</span>
            <span>Thinking: {defaultThinkingLabel}</span>
          </div>

          {!hasCompletedDocuments ? (
            <div className="rounded-[1.5rem] border border-magenta/30 bg-magenta/10 px-4 py-4 text-sm text-slate-100">
              Upload and complete at least one document in the Documents tab before chat is enabled.
            </div>
          ) : null}

          {chatError ? (
            <div className="rounded-[1.5rem] border border-magenta/30 bg-magenta/10 px-4 py-4 text-sm text-slate-100">
              {chatError}
            </div>
          ) : null}

          <MessageList loading={loading} messages={activeMessages} />
          <ChatComposer
            disabled={!hasCompletedDocuments}
            isLoading={loading}
            onSubmit={handleSubmit}
          />
        </div>
      </Card>

      <div className="space-y-6">
        <SourcePanel sources={activeMetadata.sources as SourceSummary[]} />
        <ToolActivityPanel items={activeMetadata.toolActivity} loading={loading} />
      </div>
    </div>
  );
}
