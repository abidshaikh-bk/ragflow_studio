"use client";

import { startTransition, useState } from "react";
import { ChatComposer } from "./ChatComposer";
import { MessageList } from "./MessageList";
import { SessionList } from "./SessionList";
import { SourcePanel } from "./SourcePanel";
import { ToolActivityPanel } from "./ToolActivityPanel";
import { Card } from "@/components/ui/Card";

type ChatMessage = {
  content: string;
  id: string;
  role: "assistant" | "user";
  sources?: string[];
  toolActivity?: string[];
};

type ChatSession = {
  id: string;
  messages: ChatMessage[];
  title: string;
  updatedAt: string;
};

type SourceSummary = {
  detail: string;
  title: string;
};

const defaultModelLabel = "Default server model";
const defaultThinkingLabel = "Default";

const initialSessions: ChatSession[] = [
  {
    id: "session-onboarding",
    messages: [
      {
        content: "What does the policy say about approval flow?",
        id: "m1",
        role: "user"
      },
      {
        content:
          "The onboarding policy requires manager approval before workspace access is granted. Finance review is only needed for spending requests.",
        id: "m2",
        role: "assistant",
        sources: ["employee-handbook.md chunk 4", "security-policy.txt chunk 1"],
        toolActivity: [
          "pinecone.query -> filtered by user namespace",
          "date.now -> deterministic server helper"
        ]
      }
    ],
    title: "Upload policy Q&A",
    updatedAt: "Updated 2m ago"
  },
  {
    id: "session-product",
    messages: [
      {
        content: "Summarize the product notes for the launch plan.",
        id: "m3",
        role: "user"
      },
      {
        content:
          "The current notes emphasize launch readiness, customer FAQ updates, and a short approval checklist for content changes.",
        id: "m4",
        role: "assistant",
        sources: ["product-notes.md chunk 2"],
        toolActivity: ["pinecone.query -> filtered by user namespace"]
      }
    ],
    title: "Product notes",
    updatedAt: "Updated 1h ago"
  }
];

function buildAssistantReply(message: string): Pick<ChatMessage, "content" | "sources" | "toolActivity"> {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes("approval")) {
    return {
      content:
        "Based on your indexed documents, approval requests should route to the document owner first, then move to a manager review before any external sharing happens.",
      sources: ["employee-handbook.md chunk 4", "policy.txt chunk 2"],
      toolActivity: [
        "pinecone.query -> searched the authenticated user's namespace",
        "date.now -> added deterministic timestamp context"
      ]
    };
  }

  if (normalized.includes("summarize")) {
    return {
      content:
        "Here is the short version from your indexed notes: the documents focus on approval flow, security guardrails, and the key handoff steps new teammates should follow.",
      sources: ["handbook.md chunk 1", "policy.txt chunk 1"],
      toolActivity: ["pinecone.query -> searched the authenticated user's namespace"]
    };
  }

  return {
    content:
      "I searched your private document context and found the most relevant chunks. Once persistence and retrieval are wired in, this same layout will render the live answer from the backend agent.",
    sources: ["employee-handbook.md chunk 3"],
    toolActivity: ["pinecone.query -> searched the authenticated user's namespace"]
  };
}

function getAssistantMessageMetadata(messages: ChatMessage[]) {
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  return {
    sources:
      latestAssistantMessage?.sources?.map((source, index) => ({
        detail:
          index === 0
            ? "Latest retrieval source shown for this answer."
            : "Additional supporting source returned with the assistant response.",
        title: source
      })) ?? [],
    toolActivity: latestAssistantMessage?.toolActivity ?? []
  };
}

function getSessionPreview(messages: ChatMessage[]) {
  const latestMessage = messages[messages.length - 1];

  return latestMessage?.role === "user"
    ? "Waiting for response"
    : "Updated just now";
}

export function ChatLayout() {
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState(initialSessions[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [hasCompletedDocuments] = useState(true);

  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? null;
  const activeMessages = activeSession?.messages ?? [];
  const activeMetadata = getAssistantMessageMetadata(activeMessages);

  function createNewChatSession() {
    const sessionId = `session-${Date.now()}`;

    startTransition(() => {
      setSessions((currentSessions) => [
        {
          id: sessionId,
          messages: [],
          title: "Untitled chat",
          updatedAt: "Created just now"
        },
        ...currentSessions
      ]);
      setActiveSessionId(sessionId);
      setChatError("");
    });

    return sessionId;
  }

  function handleNewChat() {
    createNewChatSession();
  }

  async function handleSubmit(message: string) {
    const sessionId = activeSessionId ?? createNewChatSession();
    const userMessage: ChatMessage = {
      content: message.trim(),
      id: `user-${Date.now()}`,
      role: "user"
    };

    setLoading(true);
    setChatError("");

    startTransition(() => {
      setSessions((currentSessions) =>
        currentSessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                messages: [...session.messages, userMessage],
                title:
                  session.title === "Untitled chat"
                    ? userMessage.content.slice(0, 36)
                    : session.title,
                updatedAt: "Searching your documents"
              }
            : session
        )
      );
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (message.toLowerCase().includes("error")) {
        throw new Error("The assistant could not complete this mock response.");
      }

      const assistantReply = buildAssistantReply(message);
      const assistantMessage: ChatMessage = {
        ...assistantReply,
        id: `assistant-${Date.now()}`,
        role: "assistant"
      };

      startTransition(() => {
        setSessions((currentSessions) =>
          currentSessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: [...session.messages, assistantMessage],
                  title:
                    session.title === "Untitled chat"
                      ? userMessage.content.slice(0, 36)
                      : session.title,
                  updatedAt: getSessionPreview([...session.messages, userMessage, assistantMessage])
                }
              : session
          )
        );
      });
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : "The assistant could not complete your request.";
      setChatError(messageText);
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
        eyebrow="Chat"
        title="Agentic RAG workspace"
        description="Use the chat composer to ask questions about your private document set. The model and thinking controls stay read-only until a later phase."
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
        <SourcePanel
          sources={activeMetadata.sources as SourceSummary[]}
        />
        <ToolActivityPanel items={activeMetadata.toolActivity} loading={loading} />
      </div>
    </div>
  );
}
