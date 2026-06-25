"use client";

import { startTransition, useEffect, useState } from "react";
import { ChatComposer } from "./ChatComposer";
import { MessageList } from "./MessageList";
import { SessionList } from "./SessionList";
import { SourcePanel } from "./SourcePanel";
import { ToolActivityPanel } from "./ToolActivityPanel";
import type { ChatModelOption, ChatSession, ThinkingLevel } from "./types";
import { Card } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

type ChatApiResponse = {
  data?: ChatSession;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

type ChatModelsApiResponse = {
  data?: {
    defaultModelConfigId: string | null;
    defaultThinkingLevel: ThinkingLevel;
    models: ChatModelOption[];
  };
  error?: string;
};

type SourceSummary = {
  detail: string;
  title: string;
};

const fallbackThinkingLevel: ThinkingLevel = "medium";

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
  const [modelOptions, setModelOptions] = useState<ChatModelOption[]>([]);
  const [selectedModelConfigId, setSelectedModelConfigId] = useState<string | null>(null);
  const [selectedThinkingLevel, setSelectedThinkingLevel] =
    useState<ThinkingLevel>(fallbackThinkingLevel);
  const [modelsError, setModelsError] = useState("");

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

    const defaultModel = modelOptions.find((model) => model.isDefault) ?? modelOptions[0];

    setSelectedModelConfigId(defaultModel?.id ?? null);
    setSelectedThinkingLevel(
      defaultModel?.defaultThinkingLevel ?? fallbackThinkingLevel
    );
  }

  async function handleSubmit(message: string) {
    setLoading(true);
    setChatError("");

    try {
      const response = await fetch("/api/chat", {
        body: JSON.stringify({
          message,
          modelConfigId: selectedModelConfigId,
          ...(activeSessionId ? { sessionId: activeSessionId } : {}),
          thinkingLevel: selectedThinkingLevel
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
        setSelectedModelConfigId(payload.data!.modelConfigId ?? null);
        setSelectedThinkingLevel(
          payload.data!.thinkingLevel ?? selectedThinkingLevel
        );
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

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/chat/models", {
          cache: "no-store"
        });
        const payload = (await response.json()) as ChatModelsApiResponse;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error || "Unable to load chat model options.");
        }

        setModelOptions(payload.data.models);
        setSelectedModelConfigId(
          activeSession?.modelConfigId ?? payload.data.defaultModelConfigId
        );
        setSelectedThinkingLevel(
          activeSession?.thinkingLevel ?? payload.data.defaultThinkingLevel
        );
      } catch (error) {
        setModelsError(
          error instanceof Error
            ? error.message
            : "Unable to load chat model options."
        );
      }
    })();
  }, [activeSession?.modelConfigId, activeSession?.thinkingLevel]);

  function handleSessionSelect(sessionId: string) {
    const session = sessions.find((candidate) => candidate.id === sessionId);

    setActiveSessionId(sessionId);

    if (!session) {
      return;
    }

    setSelectedModelConfigId(session.modelConfigId ?? null);
    setSelectedThinkingLevel(session.thinkingLevel ?? fallbackThinkingLevel);
  }

  const selectedModel =
    modelOptions.find((model) => model.id === selectedModelConfigId) ??
    modelOptions[0] ??
    null;

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <SessionList
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelect={handleSessionSelect}
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
          <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300">
              <span className="block font-mono text-[11px] uppercase tracking-[0.28em] text-aqua">
                Chat model
              </span>
              <select
                aria-label="Chat model"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-ice-white outline-none transition focus:border-aqua/60"
                onChange={(event) =>
                  setSelectedModelConfigId(event.target.value || null)
                }
                value={selectedModelConfigId ?? ""}
              >
                {modelOptions.map((model) => (
                  <option key={model.id ?? "server-default"} value={model.id ?? ""}>
                    {model.label} · {model.provider} / {model.modelName}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="block font-mono text-[11px] uppercase tracking-[0.28em] text-aqua">
                Thinking level
              </span>
              <select
                aria-label="Thinking level"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-ice-white outline-none transition focus:border-aqua/60"
                disabled={selectedModel?.supportsThinking === false}
                onChange={(event) =>
                  setSelectedThinkingLevel(event.target.value as ThinkingLevel)
                }
                value={selectedThinkingLevel}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-400">
            <span>
              Model: {selectedModel ? `${selectedModel.label}` : "Loading options"}
            </span>
            <span>Thinking: {selectedThinkingLevel}</span>
          </div>

          {!hasCompletedDocuments ? (
            <div className="rounded-[1.5rem] border border-magenta/30 bg-magenta/10 px-4 py-4 text-sm text-slate-100">
              Upload and complete at least one document in the Documents tab before chat is enabled.
            </div>
          ) : null}

          {modelsError ? (
            <ErrorAlert
              message={modelsError}
              title="Chat model options unavailable"
            />
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
