import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DocumentsPage from "@/app/(app)/documents/page";

describe("documents page explorer", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("open", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows an error for unsupported files", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      createJsonResponse({
        data: []
      })
    );

    render(<DocumentsPage />);
    await flushAsyncWork();

    fireEvent.change(screen.getByLabelText(/upload document/i), {
      target: {
        files: [new File(["name,price"], "pricing.csv", { type: "text/csv" })]
      }
    });

    expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
  });

  it("renders filters, links rows to detail pages, and opens private access links", async () => {
    vi.mocked(globalThis.fetch).mockImplementation(async (input) => {
      if (input === "/api/documents") {
        return createJsonResponse({
          data: [
            {
              documentId: "doc-123",
              fileName: "already-uploaded-handbook.md",
              fileSize: 4096,
              fileType: "text/markdown",
              indexingState: {
                provider: "openai",
                vectorCount: 24
              },
              processedChunks: 24,
              status: "completed",
              totalChunks: 24,
              updatedAt: "2026-06-22T10:00:00.000Z"
            }
          ]
        });
      }

      if (input === "/api/documents/doc-123/access-link") {
        return createJsonResponse({
          data: {
            expiresAt: "2026-06-25T10:00:00.000Z",
            expiresInSeconds: 300,
            url: "https://example.com/private"
          }
        });
      }

      throw new Error(`Unexpected fetch input: ${String(input)}`);
    });

    render(<DocumentsPage />);

    expect(await screen.findByRole("link", { name: /already-uploaded-handbook/i })).toHaveAttribute(
      "href",
      "/documents/doc-123"
    );

    fireEvent.change(screen.getByLabelText(/search documents/i), {
      target: {
        value: "handbook"
      }
    });

    fireEvent.click(screen.getByRole("button", { name: /^view$/i }));

    await waitFor(() =>
      expect(globalThis.open).toHaveBeenCalledWith(
        "https://example.com/private",
        "_blank",
        "noopener,noreferrer"
      )
    );
  });

  it("polls live status updates until processing completes", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.mocked(globalThis.fetch);
    const statusSnapshots = [
      {
        documentId: "doc-123",
        fileName: "employee-handbook.md",
        processedChunks: 0,
        status: "parsing",
        totalChunks: 24
      },
      {
        documentId: "doc-123",
        fileName: "employee-handbook.md",
        processedChunks: 24,
        status: "completed",
        totalChunks: 24
      }
    ];

    fetchMock.mockImplementation(async (input) => {
      if (input === "/api/documents") {
        return createJsonResponse({
          data: []
        });
      }

      if (input === "/api/documents/upload") {
        return createJsonResponse({
          data: {
            documentId: "doc-123",
            status: "uploaded"
          }
        });
      }

      if (input === "/api/documents/doc-123/status") {
        return createJsonResponse({
          data: statusSnapshots.shift() ?? statusSnapshots.at(-1)
        });
      }

      throw new Error(`Unexpected fetch input: ${String(input)}`);
    });

    render(<DocumentsPage />);

    fireEvent.change(screen.getByLabelText(/upload document/i), {
      target: {
        files: [new File(["# Handbook"], "employee-handbook.md", { type: "text/markdown" })]
      }
    });

    await flushAsyncWork();

    expect(screen.getByText(/polling live processing status for employee-handbook\.md/i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1200);
      await flushAsyncWork();
    });

    expect(
      screen.getByRole("status", {
        name: /pipeline running processed 0 of 24 chunks in the live pipeline/i
      })
    ).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1200);
      await flushAsyncWork();
    });

    expect(screen.getByRole("status", { name: /processing completed/i })).toBeInTheDocument();
    expect(screen.getAllByText(/24 chunks indexed/i).length).toBeGreaterThan(0);
  });
});

function createJsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json"
    },
    status: 200
  });
}

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}
