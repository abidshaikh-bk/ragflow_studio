"use client";

import { startTransition, useEffect, useState } from "react";
import { ChatComposer } from "./ChatComposer";
import { MessageList } from "./MessageList";
import { SessionList } from "./SessionList";
import { SourcePanel } from "./SourcePanel";
import { ToolActivityPanel } from "./ToolActivityPanel";
import type { ChatModelOption, ChatSession, ThinkingLevel } from "./types";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { WorkspaceIcon } from "@/components/workspace/icons";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";

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
    langsmithRunId: latestAssistantMessage?.metadata?.langsmithRunId ?? null,
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

function parseSseEvents(buffer: string) {
  const frames = buffer.split("\n\n");
  const completeFrames = frames.slice(0, -1);
  const remainder = frames.at(-1) ?? "";

  return {
    events: completeFrames
      .map((frame) => {
        const lines = frame.split("\n");
        const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
        const dataLine = lines.find((line) => line.startsWith("data:"))?.slice(5).trim();

        if (!event || !dataLine) {
          return null;
        }

        return {
          data: JSON.parse(dataLine) as unknown,
          event
        };
      })
      .filter(Boolean) as Array<{
      data: unknown;
      event: string;
    }>,
    remainder
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
    upsertSessionWithReplacement(session);
  }

  function upsertSessionWithReplacement(
    session: ChatSession,
    replaceSessionId?: string | null
  ) {
    setSessions((currentSessions) => {
      const filteredSessions = currentSessions.filter(
        (currentSession) =>
          currentSession.id !== session.id &&
          (!replaceSessionId || currentSession.id !== replaceSessionId)
      );

      return [session, ...filteredSessions];
    });
  }

  function updateSession(sessionId: string, updater: (session: ChatSession) => ChatSession) {
    setSessions((currentSessions) =>
      currentSessions.map((session) =>
        session.id === sessionId ? updater(session) : session
      )
    );
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

    const optimisticSessionId =
      activeSessionId ?? `pending-session-${Date.now().toString(36)}`;
    const optimisticAssistantId = `pending-assistant-${Date.now().toString(36)}`;
    const optimisticSession: ChatSession =
      activeSession && activeSession.id === activeSessionId
        ? {
            ...activeSession,
            messages: [
              ...activeSession.messages,
              {
                content: message,
                id: `pending-user-${Date.now().toString(36)}`,
                modelConfigId: selectedModelConfigId,
                role: "user",
                thinkingLevel: selectedThinkingLevel
              },
              {
                content: "",
                id: optimisticAssistantId,
                metadata: {
                  sources: [],
                  toolActivity: []
                },
                modelConfigId: selectedModelConfigId,
                role: "assistant",
                thinkingLevel: selectedThinkingLevel
              }
            ],
            modelConfigId: selectedModelConfigId,
            thinkingLevel: selectedThinkingLevel,
            title: message.slice(0, 36) || activeSession.title,
            updatedAt: "Just now"
          }
        : {
            id: optimisticSessionId,
            messages: [
              {
                content: message,
                id: `pending-user-${Date.now().toString(36)}`,
                modelConfigId: selectedModelConfigId,
                role: "user",
                thinkingLevel: selectedThinkingLevel
              },
              {
                content: "",
                id: optimisticAssistantId,
                metadata: {
                  sources: [],
                  toolActivity: []
                },
                modelConfigId: selectedModelConfigId,
                role: "assistant",
                thinkingLevel: selectedThinkingLevel
              }
            ],
            modelConfigId: selectedModelConfigId,
            thinkingLevel: selectedThinkingLevel,
            title: message.slice(0, 36) || "New chat",
            updatedAt: "Just now"
          };

    upsertSessionWithReplacement(optimisticSession, activeSessionId);
    setActiveSessionId(optimisticSessionId);

    try {
      const response = await fetch("/api/chat", {
        body: JSON.stringify({
          message,
          modelConfigId: selectedModelConfigId,
          ...(activeSessionId ? { sessionId: activeSessionId } : {}),
          thinkingLevel: selectedThinkingLevel
        }),
        headers: {
          accept: "text/event-stream",
          "content-type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        const payload = (await response.json()) as ChatApiResponse;
        const fieldMessage = payload.fieldErrors?.message?.[0];

        throw new Error(fieldMessage || payload.error || "Unable to save your chat message.");
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("The chat response stream was unavailable.");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSseEvents(buffer);
        buffer = parsed.remainder;

        for (const entry of parsed.events) {
          if (entry.event === "metadata") {
            const payload = entry.data as {
              langsmithRunId: string | null;
              metadata: {
                sources?: string[];
                toolActivity?: string[];
              };
            };

            updateSession(optimisticSessionId, (session) => ({
              ...session,
              messages: session.messages.map((currentMessage) =>
                currentMessage.id === optimisticAssistantId
                  ? {
                      ...currentMessage,
                      metadata: {
                        ...(currentMessage.metadata ?? {}),
                        ...(payload.metadata ?? {}),
                        ...(payload.langsmithRunId
                          ? {
                              langsmithRunId: payload.langsmithRunId
                            }
                          : {})
                      }
                    }
                  : currentMessage
              )
            }));
          }

          if (entry.event === "delta") {
            const payload = entry.data as {
              content: string;
            };

            updateSession(optimisticSessionId, (session) => ({
              ...session,
              messages: session.messages.map((currentMessage) =>
                currentMessage.id === optimisticAssistantId
                  ? {
                      ...currentMessage,
                      content: `${currentMessage.content}${payload.content}`
                    }
                  : currentMessage
              )
            }));
          }

          if (entry.event === "complete") {
            const payload = entry.data as {
              session: ChatSession;
            };

            startTransition(() => {
              upsertSessionWithReplacement(payload.session, optimisticSessionId);
              setActiveSessionId(payload.session.id);
              setSelectedModelConfigId(payload.session.modelConfigId ?? null);
              setSelectedThinkingLevel(
                payload.session.thinkingLevel ?? selectedThinkingLevel
              );
            });
          }
        }
      }
    } catch (error) {
      setSessions((currentSessions) =>
        currentSessions.filter((session) => session.id !== optimisticSessionId)
      );
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
    <WorkspaceLayout
      center={
        <div className="flex min-h-full flex-col gap-6">
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
            {activeMetadata.langsmithRunId ? (
              <span>Trace: {activeMetadata.langsmithRunId}</span>
            ) : null}
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

          <MessageList loading={false} messages={activeMessages} />
          <div className="mt-auto rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <ChatComposer
              disabled={!hasCompletedDocuments}
              isLoading={loading}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      }
      centerTitle="Private knowledge chat"
      leftCollapsedSummary={
        <>
          <CollapsedRailBadge icon="messages" label="Chats" />
          <span className="font-mono text-xs text-slate-400">{sessions.length}</span>
        </>
      }
      leftContent={
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
      }
      leftLabel="sessions"
      rightCollapsedSummary={
        <>
          <CollapsedRailBadge icon="sparkles" label="Context" />
          <span className="font-mono text-xs text-slate-400">
            {activeMetadata.sources.length + activeMetadata.toolActivity.length}
          </span>
        </>
      }
      rightContent={
        <div className="space-y-4">
          <SourcePanel sources={activeMetadata.sources as SourceSummary[]} />
          <ToolActivityPanel items={activeMetadata.toolActivity} loading={loading} />
        </div>
      }
      rightLabel="context"
    />
  );
}

function CollapsedRailBadge({
  icon,
  label
}: {
  icon: "messages" | "sparkles";
  label: string;
}) {
  return (
    <div
      aria-label={label}
      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-aqua"
    >
      <WorkspaceIcon name={icon} className="h-5 w-5" />
    </div>
  );
}
