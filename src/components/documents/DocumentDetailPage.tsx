"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Button } from "@/components/ui/Button";
import { DocumentChunksTable } from "./DocumentChunksTable";
import { DocumentEmbeddingPanel } from "./DocumentEmbeddingPanel";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import type {
  DocumentChunkRecord,
  DocumentDetailRecord,
  DocumentEmbeddingsRecord
} from "./types";

type DetailResponse = {
  data?: DocumentDetailRecord;
  error?: string;
};

type ChunksResponse = {
  data?: DocumentChunkRecord[];
  error?: string;
};

type EmbeddingsResponse = {
  data?: DocumentEmbeddingsRecord;
  error?: string;
};

type AccessLinkResponse = {
  data?: {
    url: string;
  };
  error?: string;
};

export function DocumentDetailPage({ documentId }: { documentId: string }) {
  const [document, setDocument] = useState<DocumentDetailRecord | null>(null);
  const [chunks, setChunks] = useState<DocumentChunkRecord[]>([]);
  const [embeddings, setEmbeddings] = useState<DocumentEmbeddingsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestingAction, setRequestingAction] = useState<"download" | "view" | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      try {
        const [detailResponse, chunksResponse, embeddingsResponse] = await Promise.all([
          fetch(`/api/documents/${documentId}`, { method: "GET" }),
          fetch(`/api/documents/${documentId}/chunks`, { method: "GET" }),
          fetch(`/api/documents/${documentId}/embeddings`, { method: "GET" })
        ]);
        const [detailPayload, chunksPayload, embeddingsPayload] = (await Promise.all([
          detailResponse.json(),
          chunksResponse.json(),
          embeddingsResponse.json()
        ])) as [DetailResponse, ChunksResponse, EmbeddingsResponse];

        if (!detailResponse.ok || !detailPayload.data) {
          throw new Error(detailPayload.error || "Unable to load the document detail.");
        }

        if (!chunksResponse.ok || !chunksPayload.data) {
          throw new Error(chunksPayload.error || "Unable to load the document chunks.");
        }

        if (!embeddingsResponse.ok || !embeddingsPayload.data) {
          throw new Error(
            embeddingsPayload.error || "Unable to load the embedding detail."
          );
        }

        if (cancelled) {
          return;
        }

        setDocument(detailPayload.data);
        setChunks(chunksPayload.data);
        setEmbeddings(embeddingsPayload.data);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load the document detail."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  async function handleAccessRequest(action: "download" | "view") {
    setRequestingAction(action);
    setError("");

    try {
      const response = await fetch(`/api/documents/${documentId}/access-link`, {
        body: JSON.stringify({ action }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json()) as AccessLinkResponse;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to create the document access link.");
      }

      window.open(payload.data.url, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create the document access link."
      );
    } finally {
      setRequestingAction(null);
    }
  }

  if (isLoading) {
    return (
      <Card
        eyebrow="Document detail"
        title="Loading document explorer"
        description="Fetching private metadata, chunk previews, and vector details."
      >
        <p className="text-sm text-slate-300">Loading document detail...</p>
      </Card>
    );
  }

  if (error && !document) {
    return <ErrorAlert message={error} title="Unable to load document detail" />;
  }

  if (!document || !embeddings) {
    return (
      <EmptyState
        description="This document could not be found for the current authenticated user."
        title="Document not found"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card
        eyebrow="Document detail"
        title={document.fileName}
        description="Inspect the private file metadata, chunking strategy, and vector namespace used to power retrieval."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAccessRequest("view")}
              loading={requestingAction === "view"}
            >
              View file
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleAccessRequest("download")}
              loading={requestingAction === "download"}
            >
              Download file
            </Button>
          </div>
        }
      >
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link className="text-sm text-aqua transition hover:text-aqua/80" href="/documents">
            Back to documents
          </Link>
          <DocumentStatusBadge status={document.status} />
        </div>
        {error ? <ErrorAlert message={error} title="Access error" /> : null}
        <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="File type" value={document.fileType} />
          <Metric label="File size" value={formatFileSize(document.fileSize)} />
          <Metric
            label="Chunking"
            value={`${document.chunkingStrategy.chunkCount} chunks`}
          />
          <Metric
            label="Processed"
            value={`${document.processedChunks}/${document.totalChunks}`}
          />
          <Metric label="Chunk method" value={document.chunkingStrategy.method} />
          <Metric
            label="Chunk size / overlap"
            value={`${document.chunkingStrategy.chunkSize ?? "n/a"} / ${document.chunkingStrategy.overlap ?? "n/a"}`}
          />
          <Metric label="Namespace" value={document.indexing.namespace} mono />
          <Metric
            label="Indexed at"
            value={document.indexing.indexedAt ?? "Not completed yet"}
          />
        </dl>
        {document.errorMessage ? (
          <div className="mt-5">
            <ErrorAlert message={document.errorMessage} title="Processing note" />
          </div>
        ) : null}
      </Card>

      <DocumentEmbeddingPanel embeddings={embeddings} />

      <Card
        eyebrow="Chunks"
        title="Chunk previews"
        description="Review the normalized chunk previews and Pinecone vector ids that back document retrieval."
      >
        {chunks.length === 0 ? (
          <EmptyState
            description="Chunks will appear here after parsing and chunking complete."
            title="No chunk previews yet"
          />
        ) : (
          <DocumentChunksTable chunks={chunks} />
        )}
      </Card>
    </div>
  );
}

function Metric(input: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
      <dt className="text-xs uppercase tracking-[0.22em] text-slate-400">{input.label}</dt>
      <dd
        className={`mt-2 text-sm text-ice-white ${input.mono ? "font-mono break-all" : ""}`}
      >
        {input.value}
      </dd>
    </div>
  );
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${size} B`;
}
