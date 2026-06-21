import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatLayout } from "@/components/chat/ChatLayout";
import type { ChatSession } from "@/components/chat/types";

const initialSessions: ChatSession[] = [
  {
    id: "session-1",
    messages: [
      {
        content: "What does the policy say about approval flow?",
        id: "message-1",
        role: "user"
      },
      {
        content:
          "The onboarding policy requires manager approval before workspace access is granted.",
        id: "message-2",
        metadata: {
          sources: ["employee-handbook.md chunk 4"],
          toolActivity: ["pinecone.query -> searched the authenticated user's namespace"]
        },
        role: "assistant"
      }
    ],
    title: "Upload policy Q&A",
    updatedAt: "Jun 21, 9:30 PM"
  },
  {
    id: "session-2",
    messages: [
      {
        content: "Summarize the product notes for the launch plan.",
        id: "message-3",
        role: "user"
      },
      {
        content:
          "The current notes emphasize launch readiness, customer FAQ updates, and a short approval checklist for content changes.",
        id: "message-4",
        metadata: {
          sources: ["product-notes.md chunk 2"],
          toolActivity: ["pinecone.query -> searched the authenticated user's namespace"]
        },
        role: "assistant"
      }
    ],
    title: "Product notes",
    updatedAt: "Jun 21, 8:30 PM"
  }
];

describe("chat layout", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lets the user start a new chat and shows the empty chat guidance", () => {
    render(<ChatLayout initialSessions={initialSessions} />);

    fireEvent.click(screen.getAllByRole("button", { name: /new chat/i })[0]);

    expect(screen.getByText(/ask your knowledge base/i)).toBeInTheDocument();
    expect(
      screen.getByText(/upload documents, then ask questions about your private data/i)
    ).toBeInTheDocument();
  });

  it("blocks empty chat submit", async () => {
    render(<ChatLayout initialSessions={initialSessions} />);

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(screen.getByText(/ask a question about your indexed documents/i)).toBeInTheDocument()
    );
  });

  it("submits a question and renders the persisted assistant response with source metadata", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            id: "session-3",
            messages: [
              {
                content: "Summarize my documents",
                id: "message-5",
                role: "user"
              },
              {
                content:
                  "Here is the short version from your indexed notes: the documents focus on approval flow, security guardrails, and the key handoff steps new teammates should follow.",
                id: "message-6",
                metadata: {
                  sources: ["handbook.md chunk 1", "policy.txt chunk 1"],
                  toolActivity: [
                    "pinecone.query -> searched the authenticated user's namespace"
                  ]
                },
                role: "assistant"
              }
            ],
            title: "Summarize my documents",
            updatedAt: "Jun 21, 10:05 PM"
          }
        }),
        {
          headers: {
            "content-type": "application/json"
          },
          status: 200
        }
      )
    );

    render(<ChatLayout initialSessions={initialSessions} />);

    fireEvent.click(screen.getAllByRole("button", { name: /new chat/i })[0]);
    fireEvent.change(
      screen.getByPlaceholderText(
        "What does the onboarding guide say about approval flow?"
      ),
      {
        target: { value: "Summarize my documents" }
      }
    );
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/chat",
        expect.objectContaining({
          method: "POST"
        })
      )
    );
    await waitFor(() =>
      expect(
        screen.getByText(/here is the short version from your indexed notes/i)
      ).toBeInTheDocument()
    );
    expect(screen.getAllByText(/handbook\.md chunk 1/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/pinecone\.query -> searched the authenticated user's namespace/i)
    ).toBeInTheDocument();
  });

  it("switches between existing sessions", () => {
    render(<ChatLayout initialSessions={initialSessions} />);

    fireEvent.click(screen.getByRole("button", { name: /product notes/i }));

    expect(
      screen.getByText(/summarize the product notes for the launch plan/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/launch readiness, customer faq updates/i)
    ).toBeInTheDocument();
  });
});
