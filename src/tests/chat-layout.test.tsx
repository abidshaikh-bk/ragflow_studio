import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatLayout } from "@/components/chat/ChatLayout";

describe("chat layout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("lets the user start a new chat and shows the empty chat guidance", () => {
    render(<ChatLayout />);

    fireEvent.click(screen.getAllByRole("button", { name: /new chat/i })[0]);

    expect(screen.getByText(/ask your knowledge base/i)).toBeInTheDocument();
    expect(
      screen.getByText(/upload documents, then ask questions about your private data/i)
    ).toBeInTheDocument();
  });

  it("blocks empty chat submit", async () => {
    render(<ChatLayout />);

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(screen.getByText(/ask a question about your indexed documents/i)).toBeInTheDocument()
    );
  });

  it("submits a question and renders the assistant response with source metadata", async () => {
    vi.useFakeTimers();
    render(<ChatLayout />);

    fireEvent.change(
      screen.getByPlaceholderText(
        "What does the onboarding guide say about approval flow?"
      ),
      {
        target: { value: "Summarize my documents" }
      }
    );
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(
      screen.getByText(/searching your documents and preparing an answer/i)
    ).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByText(/here is the short version from your indexed notes/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/handbook\.md chunk 1/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/pinecone\.query -> searched the authenticated user's namespace/i)
    ).toBeInTheDocument();
  });

  it("switches between existing sessions", () => {
    render(<ChatLayout />);

    fireEvent.click(screen.getByRole("button", { name: /product notes/i }));

    expect(
      screen.getByText(/summarize the product notes for the launch plan/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/launch readiness, customer faq updates/i)
    ).toBeInTheDocument();
  });
});
