import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentDetailPage } from "@/components/documents/DocumentDetailPage";

describe("DocumentDetailPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("open", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders completed document metadata, chunk previews, and embedding details", async () => {
    vi.mocked(globalThis.fetch).mockImplementation(async (input) => {
      if (input === "/api/documents/doc-123") {
        return jsonResponse({
          data: {
            chunkingStrategy: {
              chunkCount: 2,
              chunkSize: 800,
              method: "whitespace-window",
              overlap: 120
            },
            createdAt: "2026-06-25T09:00:00.000Z",
            documentId: "doc-123",
            embedding: {
              batchSize: 20,
              dimensions: 1536,
              model: "text-embedding-3-small",
              provider: "openai"
            },
            fileName: "handbook.md",
            fileSize: 4096,
            fileType: "text/markdown",
            indexing: {
              indexedAt: "2026-06-25T09:05:00.000Z",
              namespace: "user:user-123",
              vectorCount: 2
            },
            processedChunks: 2,
            status: "completed",
            totalChunks: 2,
            updatedAt: "2026-06-25T09:05:00.000Z"
          }
        });
      }

      if (input === "/api/documents/doc-123/chunks") {
        return jsonResponse({
          data: [
            {
              chunkIndex: 0,
              contentPreview: "Refunds need approval.",
              createdAt: "2026-06-25T09:02:00.000Z",
              id: "chunk-1",
              pineconeVectorId: "user-123:doc-123:0",
              tokenCount: 3
            }
          ]
        });
      }

      if (input === "/api/documents/doc-123/embeddings") {
        return jsonResponse({
          data: {
            dimensions: 1536,
            documentId: "doc-123",
            model: "text-embedding-3-small",
            namespace: "user:user-123",
            provider: "openai",
            vectorCount: 2,
            vectors: [
              {
                chunkIndex: 0,
                contentPreview: "Refunds need approval.",
                pineconeVectorId: "user-123:doc-123:0",
                tokenCount: 3
              }
            ]
          }
        });
      }

      if (input === "/api/documents/doc-123/access-link") {
        return jsonResponse({
          data: {
            url: "https://example.com/view"
          }
        });
      }

      throw new Error(`Unexpected fetch input: ${String(input)}`);
    });

    render(<DocumentDetailPage documentId="doc-123" />);

    expect(await screen.findByText(/handbook\.md/i)).toBeInTheDocument();
    expect(screen.getByText(/whitespace-window/i)).toBeInTheDocument();
    expect(screen.getAllByText(/user:user-123/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/refunds need approval/i)).toBeInTheDocument();
    expect(screen.getByText(/text-embedding-3-small/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /view file/i }));

    await waitFor(() =>
      expect(globalThis.open).toHaveBeenCalledWith(
        "https://example.com/view",
        "_blank",
        "noopener,noreferrer"
      )
    );
  });

  it("renders a not-found style error when the detail request fails", async () => {
    vi.mocked(globalThis.fetch).mockImplementation(async (input) => {
      if (input === "/api/documents/doc-404") {
        return new Response(JSON.stringify({ error: "Document not found." }), {
          headers: {
            "content-type": "application/json"
          },
          status: 404
        });
      }

      return jsonResponse({ data: [] });
    });

    render(<DocumentDetailPage documentId="doc-404" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Document not found.");
  });

  it("shows the loading state before document data arrives", async () => {
    let resolveDetail!: (value: Response) => void;

    vi.mocked(globalThis.fetch).mockImplementation((input) => {
      if (input === "/api/documents/doc-slow") {
        return new Promise<Response>((resolve) => {
          resolveDetail = resolve;
        });
      }

      if (input === "/api/documents/doc-slow/chunks") {
        return Promise.resolve(jsonResponse({ data: [] }));
      }

      return Promise.resolve(
        jsonResponse({
          data: {
            dimensions: null,
            documentId: "doc-slow",
            model: null,
            namespace: "user:user-123",
            provider: null,
            vectorCount: 0,
            vectors: []
          }
        })
      );
    });

    render(<DocumentDetailPage documentId="doc-slow" />);

    expect(screen.getByText(/loading document detail/i)).toBeInTheDocument();

    await act(async () => {
      resolveDetail(
        jsonResponse({
          data: {
            chunkingStrategy: {
              chunkCount: 0,
              chunkSize: null,
              method: "whitespace-window",
              overlap: null
            },
            createdAt: "2026-06-25T09:00:00.000Z",
            documentId: "doc-slow",
            embedding: {
              batchSize: null,
              dimensions: null,
              model: null,
              provider: null
            },
            fileName: "slow.md",
            fileSize: 100,
            fileType: "text/markdown",
            indexing: {
              indexedAt: null,
              namespace: "user:user-123",
              vectorCount: 0
            },
            processedChunks: 0,
            status: "failed",
            totalChunks: 0,
            updatedAt: "2026-06-25T09:05:00.000Z"
          }
        })
      );
    });
  });
});

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json"
    },
    status: 200
  });
}
