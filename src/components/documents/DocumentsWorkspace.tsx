"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
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

type LiveActiveUpload = {
  documentId: string;
  failedStage?: TimelineStage;
  mode: "live";
};

type PreviewActiveUpload = {
  documentId: string;
  failedStage?: TimelineStage;
  mode: "preview";
  snapshotIndex: number;
  snapshots: UploadSnapshot[];
};

type ActiveUpload = LiveActiveUpload | PreviewActiveUpload;

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

const STATUS_POLL_INTERVAL_MS = 1200;
const PREVIEW_TOTAL_CHUNKS = 24;

const initialDocuments: DocumentRecord[] = [
  {
    id: "seed-1",
    name: "employee-handbook.md",
    processedChunks: 24,
    status: "completed",
    totalChunks: 24,
    updatedAt: "Completed earlier today",
    uploadProgress: 100
  },
  {
    id: "seed-2",
    name: "security-policy.txt",
    processedChunks: 11,
    status: "indexing",
    totalChunks: 16,
    updatedAt: "Indexing now",
    uploadProgress: 100
  }
];

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

function formatUpdatedAt(status: DocumentStatus): string {
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
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const [activeUpload, setActiveUpload] = useState<ActiveUpload | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadMessage, setUploadMessage] = useState(
    "Upload a document to send it to private S3 storage before the backend pipeline reports each processing stage."
  );

  const activeDocument = activeUpload
    ? documents.find((document) => document.id === activeUpload.documentId) ?? null
    : null;
  const activeUploadDocumentId = activeUpload?.documentId;
  const activeUploadMode = activeUpload?.mode;

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
          snapshotIndex: nextIndex
        };
      });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [activeUpload]);

  useEffect(() => {
    if (!activeUploadDocumentId || activeUploadMode !== "live") {
      return;
    }

    let cancelled = false;
    let pollIntervalId = 0;

    async function pollDocumentStatus() {
      try {
        const response = await fetch(`/api/documents/${activeUploadDocumentId}/status`, {
          method: "GET"
        });
        const payload = (await response.json()) as DocumentStatusApiResponse;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error || "Unable to refresh the document status.");
        }

        if (cancelled) {
          return;
        }

        setUploadError("");
        setUploadMessage(
          isTerminalDocumentStatus(payload.data.status)
            ? `${payload.data.fileName} finished processing.`
            : `Polling live processing status for ${payload.data.fileName}.`
        );
        setDocuments((currentDocuments) =>
          currentDocuments.map((document) =>
            document.id === payload.data?.documentId
              ? {
                  ...document,
                  ...(payload.data.errorMessage
                    ? { errorMessage: payload.data.errorMessage }
                    : { errorMessage: undefined }),
                  name: payload.data.fileName,
                  processedChunks: payload.data.processedChunks,
                  status: payload.data.status,
                  totalChunks: payload.data.totalChunks,
                  updatedAt: formatUpdatedAt(payload.data.status),
                  uploadProgress: 100
                }
              : document
          )
        );

        setActiveUpload((currentActiveUpload) => {
          if (
            !currentActiveUpload ||
            currentActiveUpload.documentId !== payload.data?.documentId ||
            currentActiveUpload.mode !== "live"
          ) {
            return currentActiveUpload;
          }

          if (
            payload.data.status !== "completed" &&
            payload.data.status !== "failed"
          ) {
            return {
              ...currentActiveUpload,
              failedStage: payload.data.status
            };
          }

          if (payload.data.status === "failed") {
            return {
              ...currentActiveUpload,
              failedStage: currentActiveUpload.failedStage ?? "uploaded"
            };
          }

          return currentActiveUpload;
        });

        if (isTerminalDocumentStatus(payload.data.status)) {
          window.clearInterval(pollIntervalId);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to refresh the document status.";

        window.clearInterval(pollIntervalId);
        setUploadError(message);
        setUploadMessage("Status polling paused because the backend status check failed.");
      }
    }

    void pollDocumentStatus();
    pollIntervalId = window.setInterval(() => {
      void pollDocumentStatus();
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(pollIntervalId);
    };
  }, [activeUploadDocumentId, activeUploadMode]);

  function startPreviewUpload(name: string, shouldFail: boolean) {
    const snapshots = createSnapshots(shouldFail);
    const document = createDocumentRecord({
      documentId: `${name}-${Date.now()}`,
      name,
      snapshot: snapshots[0]
    });

    setDocuments((currentDocuments) => [document, ...currentDocuments]);
    setActiveUpload({
      documentId: document.id,
      failedStage: shouldFail ? "embedding" : undefined,
      mode: "preview",
      snapshotIndex: 0,
      snapshots
    });
  }

  async function handleFileAccepted(file: File) {
    setUploadError("");
    setUploadMessage(`Uploading ${file.name} to private S3 storage.`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/documents/upload", {
        body: formData,
        method: "POST"
      });
      const payload = (await response.json()) as UploadApiResponse;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to upload your document right now.");
      }

      const document = createDocumentRecord({
        documentId: payload.data.documentId,
        name: file.name,
        snapshot: {
          processedChunks: 0,
          status: payload.data.status,
          totalChunks: 0,
          uploadProgress: 100
        }
      });

      setDocuments((currentDocuments) => [document, ...currentDocuments]);
      setUploadMessage(
        `${file.name} reached private S3 storage. Polling live processing status now.`
      );
      setActiveUpload({
        documentId: payload.data.documentId,
        failedStage: "uploaded",
        mode: "live"
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to upload your document right now.";

      setUploadError(message);
      setUploadMessage("Fix the upload issue, then try again.");
    }
  }

  function handlePreviewFailure() {
    startPreviewUpload("contracts-import-failure.md", true);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
      <div className="space-y-6">
        {uploadError ? (
          <ErrorAlert
            message={uploadError}
            title="Document upload failed"
          />
        ) : null}
        <DocumentDropzone
          activeFileName={activeDocument?.name}
          isUploading={Boolean(activeDocument && !isTerminalDocumentStatus(activeDocument.status))}
          onFileAccepted={handleFileAccepted}
          onPreviewFailure={handlePreviewFailure}
          statusMessage={uploadMessage}
        />
        <Card
          eyebrow="History"
          title="Indexed document list"
          description="Successful uploads now write to S3 and then poll the live backend ingestion status until processing completes."
        >
          <DocumentTable documents={documents} />
        </Card>
      </div>
      <div className="space-y-6">
        <UploadProgressCard activeDocument={activeDocument} />
        <Card
          eyebrow="Stages"
          title="Processing timeline"
          description="This list follows the live ingestion status model and highlights the active backend-reported stage."
        >
          <ProcessingTimeline
            currentStatus={activeDocument?.status ?? "uploaded"}
            failedStage={activeUpload?.failedStage}
          />
        </Card>
      </div>
    </div>
  );
}

function createDocumentRecord(input: {
  documentId: string;
  name: string;
  snapshot: UploadSnapshot;
}): DocumentRecord {
  return {
    id: input.documentId,
    ...(input.snapshot.errorMessage ? { errorMessage: input.snapshot.errorMessage } : {}),
    name: input.name,
    processedChunks: input.snapshot.processedChunks,
    status: input.snapshot.status,
    totalChunks: input.snapshot.totalChunks,
    updatedAt: "Queued just now",
    uploadProgress: input.snapshot.uploadProgress
  };
}
