import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import ChatPage from "@/app/(app)/chat/page";
import HistoryPage from "@/app/(app)/history/page";
import DocumentsPage from "@/app/(app)/documents/page";
import SettingsPage from "@/app/(app)/settings/page";
import AdminPage from "@/app/(app)/admin/page";
import { ChatComposer } from "@/components/chat/ChatComposer";

const defaultModelId = "11111111-1111-4111-8111-111111111111";

vi.mock("next/navigation", () => ({
  usePathname: () => "/chat"
}));

vi.mock("@/server/auth/session", () => ({
  requireAuthenticatedUser: async () => ({
    id: "user-123"
  })
}));

vi.mock("@/server/auth/authorization", () => ({
  requireAdminPageAccess: async () => ({
    isAdmin: true
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
      vi.fn().mockImplementation(async (input) => {
        if (input === "/api/documents") {
          return {
            json: async () => ({
              data: []
            }),
            ok: true
          };
        }

        if (input === "/api/chat/models") {
          return {
            json: async () => ({
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
            ok: true
          };
        }

        if (input === "/api/history") {
          return {
            json: async () => ({
              data: []
            }),
            ok: true
          };
        }

        if (input === "/api/admin/assistant") {
          return {
            json: async () => ({
              data: {
                systemPrompt: "",
                toolPolicy: {
                  enableDateTime: true,
                  enableVectorSearch: true,
                  enableWebSearch: true
                },
                updatedAt: "2026-06-25T10:00:00.000Z"
              }
            }),
            ok: true
          };
        }

        if (input === "/api/admin/mcp-servers") {
          return {
            json: async () => ({
              data: []
            }),
            ok: true
          };
        }

        return {
          json: async () => ({
            data: {
              chatApiKeyMasked: "********1234",
              chatModel: "gpt-4.1-mini",
              chatProvider: "openai",
              embeddingApiKeyMasked: "********5678",
              embeddingDimensions: 1024,
              embeddingModel: "text-embedding-3-small",
              embeddingProvider: "openai"
            }
          }),
          ok: true
        };
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the chat workspace shell", async () => {
    render(await ChatPage());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByRole("heading", { name: /private knowledge chat/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/recent chats/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "What does the onboarding guide say about approval flow?"
      )
    ).toBeInTheDocument();
    expect(await screen.findByLabelText("Chat model")).toBeInTheDocument();
  });

  it("renders the documents workspace shell", async () => {
    render(<DocumentsPage />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByRole("heading", { name: /document library/i })
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

  it("renders the history page and admin placeholder inside the protected shell", async () => {
    const adminPage = await AdminPage();

    render(
      <div>
        <HistoryPage />
        {adminPage}
      </div>
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByRole("heading", { level: 1, name: /^run history$/i })
    ).toBeInTheDocument();
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
