"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { DocumentDropzone } from "./DocumentDropzone";
import { DocumentTable } from "./DocumentTable";
import { ProcessingTimeline } from "./ProcessingTimeline";
import { UploadProgressCard } from "./UploadProgressCard";
import {
  isTerminalDocumentStatus,
  type DocumentRecord,
  type DocumentStatus
} from "./types";

type TimelineStage = Exclude<DocumentStatus, "completed" | "failed">;

type UploadSnapshot = {
  errorMessage?: string;
  processedChunks: number;
  status: DocumentStatus;
  totalChunks: number;
  uploadProgress: number;
};

type ActiveUpload =
  | {
      documentId: string;
      failedStage?: TimelineStage;
      mode: "live";
    }
  | {
      documentId: string;
      failedStage?: TimelineStage;
      mode: "preview";
      snapshotIndex: number;
      snapshots: UploadSnapshot[];
    };

type UploadApiResponse = {
  data?: {
    documentId: string;
    status: "uploaded";
  };
  error?: string;
};

type DocumentStatusApiResponse = {
  data?: {
    documentId: string;
    errorMessage?: string;
    fileName: string;
    processedChunks: number;
    status: DocumentStatus;
    totalChunks: number;
  };
  error?: string;
};

type DocumentListApiResponse = {
  data?: Array<{
    documentId: string;
    errorMessage?: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    indexingState?: {
      provider?: string;
      vectorCount: number;
    };
    processedChunks: number;
    status: DocumentStatus;
    totalChunks: number;
    updatedAt: string;
  }>;
  error?: string;
};

type AccessLinkApiResponse = {
  data?: {
    expiresAt: string;
    expiresInSeconds: number;
    url: string;
  };
  error?: string;
};

const STATUS_POLL_INTERVAL_MS = 1200;
const PREVIEW_TOTAL_CHUNKS = 24;

function createSnapshots(shouldFail: boolean): UploadSnapshot[] {
  const snapshots: UploadSnapshot[] = [
    {
      processedChunks: 0,
      status: "uploaded",
      totalChunks: PREVIEW_TOTAL_CHUNKS,
      uploadProgress: 100
    },
    {
      processedChunks: 0,
      status: "parsing",
      totalChunks: PREVIEW_TOTAL_CHUNKS,
      uploadProgress: 100
    },
    {
      processedChunks: 4,
      status: "chunking",
      totalChunks: PREVIEW_TOTAL_CHUNKS,
      uploadProgress: 100
    },
    {
      processedChunks: 10,
      status: "embedding",
      totalChunks: PREVIEW_TOTAL_CHUNKS,
      uploadProgress: 100
    },
    {
      processedChunks: 18,
      status: "indexing",
      totalChunks: PREVIEW_TOTAL_CHUNKS,
      uploadProgress: 100
    },
    {
      processedChunks: PREVIEW_TOTAL_CHUNKS,
      status: "completed",
      totalChunks: PREVIEW_TOTAL_CHUNKS,
      uploadProgress: 100
    }
  ];

  if (!shouldFail) {
    return snapshots;
  }

  return [
    ...snapshots.slice(0, 4),
    {
      errorMessage: "Embedding provider timed out while generating vectors for this document.",
      processedChunks: 10,
      status: "failed",
      totalChunks: PREVIEW_TOTAL_CHUNKS,
      uploadProgress: 100
    }
  ];
}

function formatUpdatedAt(status: DocumentStatus) {
  switch (status) {
    case "uploaded":
      return "Uploaded just now";
    case "parsing":
      return "Parsing in progress";
    case "chunking":
      return "Chunking text";
    case "embedding":
      return "Generating embeddings";
    case "indexing":
      return "Indexing in Pinecone";
    case "completed":
      return "Completed moments ago";
    case "failed":
      return "Failed moments ago";
    default:
      return "Updated just now";
  }
}

export function DocumentsWorkspace() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activeUpload, setActiveUpload] = useState<ActiveUpload | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [listError, setListError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [accessError, setAccessError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DocumentStatus>("all");
  const [searchValue, setSearchValue] = useState("");
  const [requestingAccessForId, setRequestingAccessForId] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState(
    "Upload a document to send it to private S3 storage, then inspect chunks and vector metadata from the explorer."
  );

  const activeDocument = activeUpload
    ? documents.find((document) => document.id === activeUpload.documentId) ?? null
    : null;

  const visibleDocuments = useMemo(() => {
    return documents.filter((document) => {
      const matchesStatus = statusFilter === "all" || document.status === statusFilter;
      const matchesSearch =
        searchValue.trim().length === 0 ||
        document.name.toLowerCase().includes(searchValue.trim().toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [documents, searchValue, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      try {
        const response = await fetch("/api/documents", {
          method: "GET"
        });
        const payload = (await response.json()) as DocumentListApiResponse;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error || "Unable to load your documents.");
        }

        if (cancelled) {
          return;
        }

        const nextDocuments = payload.data.map(mapListedDocumentToRecord);
        const activeBackendDocument = nextDocuments.find(
          (document) => !isTerminalDocumentStatus(document.status)
        );

        setDocuments(nextDocuments);

        if (activeBackendDocument) {
          setActiveUpload({
            documentId: activeBackendDocument.id,
            failedStage: activeBackendDocument.status as TimelineStage,
            mode: "live"
          });
          setUploadMessage(
            `Resuming live processing updates for ${activeBackendDocument.name}.`
          );
        }
      } catch (error) {
        if (!cancelled) {
          setListError(
            error instanceof Error ? error.message : "Unable to load your documents."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDocuments(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeUpload || activeUpload.mode !== "preview") {
      return;
    }

    const currentSnapshot = activeUpload.snapshots[activeUpload.snapshotIndex];

    if (!currentSnapshot || isTerminalDocumentStatus(currentSnapshot.status)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveUpload((currentActiveUpload) => {
        if (!currentActiveUpload || currentActiveUpload.mode !== "preview") {
          return currentActiveUpload;
        }

        const nextIndex = Math.min(
          currentActiveUpload.snapshotIndex + 1,
          currentActiveUpload.snapshots.length - 1
        );
        const nextSnapshot = currentActiveUpload.snapshots[nextIndex];

        setDocuments((currentDocuments) =>
          currentDocuments.map((document) =>
            document.id === currentActiveUpload.documentId
              ? {
                  ...document,
                  errorMessage: nextSnapshot.errorMessage,
                  processedChunks: nextSnapshot.processedChunks,
                  status: nextSnapshot.status,
                  totalChunks: nextSnapshot.totalChunks,
                  updatedAt: formatUpdatedAt(nextSnapshot.status),
                  uploadProgress: nextSnapshot.uploadProgress
                }
              : document
          )
        );

        return {
          ...currentActiveUpload,
          failedStage:
            nextSnapshot.status === "failed"
              ? "embedding"
              : (nextSnapshot.status as TimelineStage),
          snapshotIndex: nextIndex
        };
      });
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeUpload]);

  useEffect(() => {
    if (!activeUpload || activeUpload.mode !== "live") {
      return;
    }

    if (!activeDocument || isTerminalDocumentStatus(activeDocument.status)) {
      return;
    }

    let cancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/documents/${activeUpload.documentId}/status`, {
          method: "GET"
        });
        const payload = (await response.json()) as DocumentStatusApiResponse;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error || "Unable to poll document status.");
        }

        if (cancelled) {
          return;
        }

        setDocuments((currentDocuments) =>
          currentDocuments.map((document) =>
            document.id === activeUpload.documentId
              ? {
                  ...document,
                  errorMessage: payload.data?.errorMessage,
                  name: payload.data?.fileName ?? document.name,
                  processedChunks: payload.data?.processedChunks ?? document.processedChunks,
                  status: payload.data?.status ?? document.status,
                  totalChunks: payload.data?.totalChunks ?? document.totalChunks,
                  updatedAt: formatUpdatedAt(payload.data?.status ?? document.status),
                  uploadProgress: 100
                }
              : document
          )
        );

        if (isTerminalDocumentStatus(payload.data.status)) {
          setUploadMessage(
            payload.data.status === "completed"
              ? `${payload.data.fileName} is ready for chat retrieval and document inspection.`
              : `${payload.data.fileName} failed during processing.`
          );
        }
      } catch (error) {
        if (!cancelled) {
          setUploadError(
            error instanceof Error ? error.message : "Unable to poll document status."
          );
        }
      }
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeDocument, activeUpload]);

  async function handleFileAccepted(file: File) {
    setAccessError("");
    setUploadError("");
    setIsUploading(true);
    setUploadMessage(`Uploading ${file.name} and waiting for pipeline status...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents/upload", {
        body: formData,
        method: "POST"
      });
      const payload = (await response.json()) as UploadApiResponse;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to upload the document.");
      }

      const nextDocument: DocumentRecord = {
        id: payload.data.documentId,
        name: file.name,
        fileSize: file.size,
        fileType: file.type || inferFileType(file.name),
        processedChunks: 0,
        status: payload.data.status,
        totalChunks: 0,
        updatedAt: "Uploaded just now",
        uploadProgress: 100
      };

      setDocuments((currentDocuments) => [nextDocument, ...currentDocuments]);
      setActiveUpload({
        documentId: payload.data.documentId,
        failedStage: "uploaded",
        mode: "live"
      });
      setUploadMessage(`Polling live processing status for ${file.name}.`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unable to upload the document.");
    } finally {
      setIsUploading(false);
    }
  }

  function handlePreviewFailure() {
    const previewDocumentId = "preview-document";
    const snapshots = createSnapshots(true);

    setUploadError("");
    setAccessError("");
    setDocuments((currentDocuments) => {
      const previewRecord: DocumentRecord = {
        errorMessage: undefined,
        id: previewDocumentId,
        name: "preview-handbook.md",
        processedChunks: 0,
        status: "uploaded",
        totalChunks: PREVIEW_TOTAL_CHUNKS,
        updatedAt: "Uploaded just now",
        uploadProgress: 100
      };

      return [previewRecord, ...currentDocuments.filter((document) => document.id !== previewDocumentId)];
    });
    setActiveUpload({
      documentId: previewDocumentId,
      failedStage: "uploaded",
      mode: "preview",
      snapshotIndex: 0,
      snapshots
    });
    setUploadMessage("Previewing a failure path for the document pipeline.");
  }

  async function handleRequestAccessLink(
    documentId: string,
    action: "download" | "view"
  ) {
    setAccessError("");
    setRequestingAccessForId(documentId);

    try {
      const response = await fetch(`/api/documents/${documentId}/access-link`, {
        body: JSON.stringify({ action }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const payload = (await response.json()) as AccessLinkApiResponse;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to create a private access link.");
      }

      window.open(payload.data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setAccessError(
        error instanceof Error ? error.message : "Unable to create a private access link."
      );
    } finally {
      setRequestingAccessForId(null);
    }
  }

  const completedCount = documents.filter((document) => document.status === "completed").length;
  const failedCount = documents.filter((document) => document.status === "failed").length;
  const inFlightCount = documents.filter(
    (document) => !isTerminalDocumentStatus(document.status)
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Completed" value={completedCount} />
        <MetricCard label="Processing" value={inFlightCount} />
        <MetricCard label="Needs review" value={failedCount} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DocumentDropzone
          activeFileName={activeDocument?.name}
          isUploading={isUploading}
          onFileAccepted={handleFileAccepted}
          onPreviewFailure={handlePreviewFailure}
          statusMessage={uploadMessage}
        />
        <UploadProgressCard activeDocument={activeDocument} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card
          eyebrow="Stages"
          title="Processing timeline"
          description="Track the current backend stage while uploads move toward a completed, retrievable document."
        >
          <ProcessingTimeline
            currentStatus={activeDocument?.status ?? "uploaded"}
            failedStage={activeUpload?.failedStage}
          />
        </Card>

        <Card
          eyebrow="Explorer"
          title="Uploaded document index"
          description="Filter completed and in-flight uploads, then open a structured detail view for chunk and vector metadata."
        >
          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
            <Input
              aria-label="Search documents"
              label="Search documents"
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Filter by file name"
              value={searchValue}
            />
            <label className="flex flex-col gap-2 text-sm text-slate-300">
              <span>Status filter</span>
              <select
                aria-label="Status filter"
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-ice-white outline-none transition focus:border-aqua focus:ring-2 focus:ring-aqua/30"
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | DocumentStatus)
                }
                value={statusFilter}
              >
                <option value="all">All statuses</option>
                <option value="uploaded">Uploaded</option>
                <option value="parsing">Parsing</option>
                <option value="chunking">Chunking</option>
                <option value="embedding">Embedding</option>
                <option value="indexing">Indexing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </label>
          </div>

          {listError ? <ErrorAlert message={listError} title="Load error" /> : null}
          {uploadError ? <ErrorAlert message={uploadError} title="Upload error" /> : null}
          {accessError ? <ErrorAlert message={accessError} title="Access error" /> : null}

          {isLoadingDocuments ? (
            <p className="text-sm text-slate-400">Loading your uploaded documents...</p>
          ) : visibleDocuments.length === 0 ? (
            <EmptyState
              description="Upload a file, or adjust the current filters to reveal more document records."
              title="No matching documents"
            />
          ) : (
            <DocumentTable
              documents={visibleDocuments}
              onRequestAccessLink={handleRequestAccessLink}
              requestingAccessForId={requestingAccessForId}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function MetricCard(input: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{input.label}</p>
      <p className="mt-3 font-heading text-3xl text-ice-white">{input.value}</p>
    </Card>
  );
}

function inferFileType(fileName: string) {
  if (fileName.endsWith(".md")) {
    return "text/markdown";
  }

  if (fileName.endsWith(".txt")) {
    return "text/plain";
  }

  if (fileName.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (fileName.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  return "application/octet-stream";
}

function mapListedDocumentToRecord(document: {
  documentId: string;
  errorMessage?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  indexingState?: {
    provider?: string;
    vectorCount: number;
  };
  processedChunks: number;
  status: DocumentStatus;
  totalChunks: number;
  updatedAt: string;
}): DocumentRecord {
  return {
    ...(document.errorMessage ? { errorMessage: document.errorMessage } : {}),
    fileSize: document.fileSize,
    fileType: document.fileType,
    id: document.documentId,
    indexingState: document.indexingState,
    name: document.fileName,
    processedChunks: document.processedChunks,
    status: document.status,
    totalChunks: document.totalChunks,
    updatedAt: document.updatedAt,
    uploadProgress: 100
  };
}
