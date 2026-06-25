import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import ChatPage from "@/app/(app)/chat/page";
import HistoryPage from "@/app/(app)/history/page";
import DocumentsPage from "@/app/(app)/documents/page";
import SettingsPage from "@/app/(app)/settings/page";
import AdminPage from "@/app/(app)/admin/page";
import { ChatComposer } from "@/components/chat/ChatComposer";

vi.mock("next/navigation", () => ({
  usePathname: () => "/chat"
}));

vi.mock("@/server/auth/session", () => ({
  requireAuthenticatedUser: async () => ({
    id: "user-123"
  })
}));

vi.mock("@/server/supabase/server", () => ({
  createServerSupabaseClient: async () => ({})
}));

vi.mock("@/server/chat/persistence", () => ({
  listChatSessions: async () => [
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
    }
  ]
}));

describe("phase 1a page scaffolds", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input) => ({
        json: async () =>
          input === "/api/documents"
            ? {
                data: []
              }
            : {
                data: {
                  chatApiKeyMasked: "********1234",
                  chatModel: "gpt-4.1-mini",
                  chatProvider: "openai",
                  embeddingApiKeyMasked: "********5678",
                  embeddingDimensions: 1024,
                  embeddingModel: "text-embedding-3-small",
                  embeddingProvider: "openai"
                }
              },
        ok: true
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the chat workspace shell", async () => {
    render(await ChatPage());

    expect(
      screen.getByRole("heading", { name: /agentic rag workspace/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/recent chats/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "What does the onboarding guide say about approval flow?"
      )
    ).toBeInTheDocument();
  });

  it("renders the documents workspace shell", async () => {
    render(<DocumentsPage />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByRole("heading", { name: /document ingestion workspace/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/upload document/i)).toBeInTheDocument();
    expect(screen.getByText(/processing timeline/i)).toBeInTheDocument();
  });

  it("renders the settings workspace shell", async () => {
    render(<SettingsPage />);

    expect(
      screen.getByRole("heading", { name: /assistant configuration/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /model configuration status/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Chat provider")).toBeInTheDocument();
    expect(screen.getByLabelText("Embedding provider")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText(/stored value on file: \*{8}1234/i)
      ).toBeInTheDocument()
    );
  });

  it("renders the history and admin placeholders inside the protected shell", () => {
    render(
      <div>
        <HistoryPage />
        <AdminPage />
      </div>
    );

    expect(screen.getByRole("heading", { name: /run history/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /shared assistant control plane/i })
    ).toBeInTheDocument();
  });

  it("blocks empty chat submit and calls the handler when populated", async () => {
    const onSubmit = vi.fn();

    render(<ChatComposer onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(screen.getByText(/ask a question about your indexed documents/i)).toBeInTheDocument()
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        "What does the onboarding guide say about approval flow?"
      ),
      {
      target: { value: "Summarize my handbook" }
      }
    );
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith("Summarize my handbook")
    );
  });
});
