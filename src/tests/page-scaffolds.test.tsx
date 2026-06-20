import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import ChatPage from "@/app/(app)/chat/page";
import DocumentsPage from "@/app/(app)/documents/page";
import SettingsPage from "@/app/(app)/settings/page";
import { ChatComposer } from "@/components/chat/ChatComposer";

vi.mock("next/navigation", () => ({
  usePathname: () => "/chat"
}));

describe("phase 1a page scaffolds", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          data: {
            chatApiKeyMasked: "********1234",
            chatModel: "gpt-4.1-mini",
            chatProvider: "openai",
            embeddingApiKeyMasked: "********5678",
            embeddingModel: "text-embedding-3-small",
            embeddingProvider: "openai"
          }
        }),
        ok: true
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the chat workspace shell", () => {
    render(<ChatPage />);

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

  it("renders the documents workspace shell", () => {
    render(<DocumentsPage />);

    expect(
      screen.getByRole("heading", { name: /document ingestion workspace/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/upload document/i)).toBeInTheDocument();
    expect(screen.getByText(/processing timeline/i)).toBeInTheDocument();
  });

  it("renders the settings workspace shell", async () => {
    render(<SettingsPage />);

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
