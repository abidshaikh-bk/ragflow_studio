import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DocumentsPage from "@/app/(app)/documents/page";

describe("documents page upload flow", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows an error for unsupported files", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      createJsonResponse(true, {
        data: []
      })
    );

    render(<DocumentsPage />);
    await act(async () => {
      await flushAsyncWork();
    });

    fireEvent.change(screen.getByLabelText(/upload document/i), {
      target: {
        files: [new File(["name,price"], "pricing.csv", { type: "text/csv" })]
      }
    });

    expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
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
        return createJsonResponse(true, {
          data: []
        });
      }

      if (input === "/api/documents/upload") {
        return createJsonResponse(true, {
          data: {
            documentId: "doc-123",
            status: "uploaded"
          }
        });
      }

      if (input === "/api/documents/doc-123/status") {
        const nextSnapshot = statusSnapshots.shift() ?? statusSnapshots.at(-1);

        return createJsonResponse(true, {
          data: nextSnapshot
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

    await act(async () => {
      await flushAsyncWork();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/documents/upload",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/documents/doc-123/status",
      expect.objectContaining({
        method: "GET"
      })
    );
    expect(screen.getByText(/selected document: employee-handbook.md/i)).toBeInTheDocument();
    expect(
      screen.getByText(/polling live processing status for employee-handbook\.md/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/^parsing$/i, { selector: "p" }).length).toBeGreaterThan(0);

    const statusCallCountBeforeCompletion = fetchMock.mock.calls.length;

    await act(async () => {
      vi.advanceTimersByTime(1200);
      await flushAsyncWork();
    });

    expect(screen.getByRole("status", { name: /processing completed/i })).toBeInTheDocument();
    expect(screen.getAllByText(/24 chunks indexed/i).length).toBeGreaterThan(0);

    await act(async () => {
      vi.advanceTimersByTime(2400);
    });

    expect(fetchMock.mock.calls.length).toBe(statusCallCountBeforeCompletion + 1);
  });

  it("stops polling when the backend reports a failed document", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.mocked(globalThis.fetch);
    const statusSnapshots = [
      {
        documentId: "doc-123",
        fileName: "employee-handbook.md",
        processedChunks: 10,
        status: "embedding",
        totalChunks: 24
      },
      {
        documentId: "doc-123",
        errorMessage: "Embedding provider timed out while generating vectors for this document.",
        fileName: "employee-handbook.md",
        processedChunks: 10,
        status: "failed",
        totalChunks: 24
      }
    ];

    fetchMock.mockImplementation(async (input) => {
      if (input === "/api/documents") {
        return createJsonResponse(true, {
          data: []
        });
      }

      if (input === "/api/documents/upload") {
        return createJsonResponse(true, {
          data: {
            documentId: "doc-123",
            status: "uploaded"
          }
        });
      }

      if (input === "/api/documents/doc-123/status") {
        const nextSnapshot = statusSnapshots.shift() ?? statusSnapshots.at(-1);

        return createJsonResponse(true, {
          data: nextSnapshot
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

    await act(async () => {
      await flushAsyncWork();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/documents/doc-123/status",
      expect.objectContaining({
        method: "GET"
      })
    );
    expect(screen.getAllByText(/^embedding$/i, { selector: "p" }).length).toBeGreaterThan(0);

    const statusCallCountBeforeFailure = fetchMock.mock.calls.length;

    await act(async () => {
      vi.advanceTimersByTime(1200);
      await flushAsyncWork();
    });

    expect(screen.getByRole("status", { name: /processing failed/i })).toBeInTheDocument();
    expect(screen.getAllByText(/embedding provider timed out while generating vectors/i).length)
      .toBeGreaterThan(0);

    await act(async () => {
      vi.advanceTimersByTime(2400);
    });

    expect(fetchMock.mock.calls.length).toBe(statusCallCountBeforeFailure + 1);
  });

  it("renders a failed terminal state from the preview action", async () => {
    vi.useFakeTimers();
    vi.mocked(globalThis.fetch).mockResolvedValue(
      createJsonResponse(true, {
        data: []
      })
    );

    render(<DocumentsPage />);
    await act(async () => {
      await flushAsyncWork();
    });

    fireEvent.click(screen.getByRole("button", { name: /preview failed state/i }));
    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByRole("status", { name: /processing failed/i })).toBeInTheDocument();
    expect(screen.getAllByText(/embedding provider timed out while generating vectors/i).length)
      .toBeGreaterThan(0);
  });

  it("shows an upload error when the API rejects the file", async () => {
    vi.mocked(globalThis.fetch).mockImplementation(async (input) => {
      if (input === "/api/documents") {
        return createJsonResponse(true, {
          data: []
        });
      }

      return createJsonResponse(false, {
        error: "Unauthorized"
      });
    });

    render(<DocumentsPage />);

    fireEvent.change(screen.getByLabelText(/upload document/i), {
      target: {
        files: [new File(["# Handbook"], "employee-handbook.md", { type: "text/markdown" })]
      }
    });

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Unauthorized")
    );
  });

  it("loads previously uploaded documents from the backend", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      createJsonResponse(true, {
        data: [
          {
            documentId: "doc-123",
            fileName: "already-uploaded-handbook.md",
            processedChunks: 24,
            status: "completed",
            totalChunks: 24,
            updatedAt: "2026-06-22T10:00:00.000Z"
          }
        ]
      })
    );

    render(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText(/already-uploaded-handbook\.md/i)).toBeInTheDocument();
    });
  });
});

function createJsonResponse(ok: boolean, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json"
    },
    status: ok ? 200 : 400
  });
}

async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
}
