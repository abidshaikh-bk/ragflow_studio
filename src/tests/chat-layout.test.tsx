import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatLayout } from "@/components/chat/ChatLayout";
import type { ChatSession } from "@/components/chat/types";

const defaultModelId = "11111111-1111-4111-8111-111111111111";

function createStreamResponse(body: string) {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(body));
        controller.close();
      }
    }),
    {
      headers: {
        "content-type": "text/event-stream"
      },
      status: 200
    }
  );
}

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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input) => {
        if (input === "/api/chat/models") {
          return new Response(
            JSON.stringify({
              data: {
                defaultModelConfigId: defaultModelId,
                defaultThinkingLevel: "medium",
                models: [
                  {
                    defaultThinkingLevel: "medium",
                    id: defaultModelId,
                    isDefault: true,
                    label: "Default chat model",
                    modelName: "gpt-4.1-mini",
                    provider: "openai",
                    supportsThinking: true
                  }
                ]
              }
            }),
            {
              headers: {
                "content-type": "application/json"
              },
              status: 200
            }
          );
        }

        throw new Error(`Unexpected fetch input: ${String(input)}`);
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lets the user start a new chat and shows the empty chat guidance", async () => {
    render(<ChatLayout initialSessions={initialSessions} />);

    await screen.findByLabelText("Chat model");
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
    vi.mocked(globalThis.fetch).mockImplementation(async (input) => {
      if (input === "/api/chat/models") {
        return new Response(
          JSON.stringify({
            data: {
              defaultModelConfigId: defaultModelId,
              defaultThinkingLevel: "medium",
              models: [
                {
                  defaultThinkingLevel: "medium",
                  id: defaultModelId,
                  isDefault: true,
                  label: "Default chat model",
                  modelName: "gpt-4.1-mini",
                  provider: "openai",
                  supportsThinking: true
                }
              ]
            }
          }),
          {
            headers: {
              "content-type": "application/json"
            },
            status: 200
          }
        );
      }

      if (input === "/api/chat") {
        return createStreamResponse(
          [
            `event: metadata\ndata: ${JSON.stringify({
              langsmithRunId: "trace-123",
              metadata: {
                sources: ["handbook.md chunk 1", "policy.txt chunk 1"],
                toolActivity: [
                  "pinecone.query -> searched the authenticated user's namespace"
                ]
              },
              sessionId: "session-3"
            })}\n`,
            `event: delta\ndata: ${JSON.stringify({
              content: "Here is the short version from your indexed notes: "
            })}\n`,
            `event: delta\ndata: ${JSON.stringify({
              content:
                "the documents focus on approval flow, security guardrails, and the key handoff steps new teammates should follow."
            })}\n`,
            `event: complete\ndata: ${JSON.stringify({
              langsmithRunId: "trace-123",
              session: {
                id: "session-3",
                messages: [
                  {
                    content: "Summarize my documents",
                    id: "message-5",
                    modelConfigId: defaultModelId,
                    role: "user",
                    thinkingLevel: "high"
                  },
                  {
                    content:
                      "Here is the short version from your indexed notes: the documents focus on approval flow, security guardrails, and the key handoff steps new teammates should follow.",
                    id: "message-6",
                    metadata: {
                      langsmithRunId: "trace-123",
                      sources: ["handbook.md chunk 1", "policy.txt chunk 1"],
                      toolActivity: [
                        "pinecone.query -> searched the authenticated user's namespace"
                      ]
                    },
                    modelConfigId: defaultModelId,
                    role: "assistant",
                    thinkingLevel: "high"
                  }
                ],
                modelConfigId: defaultModelId,
                thinkingLevel: "high",
                title: "Summarize my documents",
                updatedAt: "Jun 21, 10:05 PM"
              }
            })}\n`
          ].join("\n")
        );
      }

      throw new Error(`Unexpected fetch input: ${String(input)}`);
    });

    render(<ChatLayout initialSessions={initialSessions} />);

    await screen.findByLabelText("Chat model");
    fireEvent.click(screen.getAllByRole("button", { name: /new chat/i })[0]);
    fireEvent.change(screen.getByLabelText("Thinking level"), {
      target: { value: "high" }
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "What does the onboarding guide say about approval flow?"
      ),
      {
        target: { value: "Summarize my documents" }
      }
    );
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getAllByText("Summarize my documents").length).toBeGreaterThan(0);

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/chat",
        expect.objectContaining({
          headers: {
            accept: "text/event-stream",
            "content-type": "application/json"
          },
          body: JSON.stringify({
            message: "Summarize my documents",
            modelConfigId: defaultModelId,
            thinkingLevel: "high"
          }),
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
    expect(screen.getByText(/trace-123/i)).toBeInTheDocument();
    expect(screen.getByText(/thinking: high/i)).toBeInTheDocument();
  });

  it("switches between existing sessions", async () => {
    render(<ChatLayout initialSessions={initialSessions} />);

    await screen.findByLabelText("Chat model");
    fireEvent.click(screen.getByRole("button", { name: /product notes/i }));

    expect(
      screen.getByText(/summarize the product notes for the launch plan/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/launch readiness, customer faq updates/i)
    ).toBeInTheDocument();
  });

  it("renders the chat model and thinking controls", async () => {
    render(<ChatLayout initialSessions={initialSessions} />);

    expect(await screen.findByLabelText("Chat model")).toBeInTheDocument();
    expect(screen.getByLabelText("Thinking level")).toHaveValue("medium");
    expect(screen.getAllByText(/default chat model/i).length).toBeGreaterThan(0);
  });
});
