"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { DocumentDropzone } from "./DocumentDropzone";
import { DocumentTable } from "./DocumentTable";
import { ProcessingTimeline } from "./ProcessingTimeline";
import { UploadProgressCard } from "./UploadProgressCard";
import {
  type DocumentRecord,
  type DocumentStatus
} from "./types";

type TimelineStage = Exclude<DocumentStatus, "completed" | "failed">;

type UploadSnapshot = {
  errorMessage?: string;
  processedChunks: number;
  status: DocumentStatus;
  uploadProgress: number;
};

type ActiveUpload = {
  documentId: string;
  failedStage?: TimelineStage;
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
    { processedChunks: 0, status: "uploaded", uploadProgress: 100 },
    { processedChunks: 0, status: "parsing", uploadProgress: 100 },
    { processedChunks: 4, status: "chunking", uploadProgress: 100 },
    { processedChunks: 10, status: "embedding", uploadProgress: 100 },
    { processedChunks: 18, status: "indexing", uploadProgress: 100 },
    { processedChunks: 24, status: "completed", uploadProgress: 100 }
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
    "Upload a document to send it to private S3 storage before the processing pipeline continues."
  );

  const activeDocument = activeUpload
    ? documents.find((document) => document.id === activeUpload.documentId) ?? null
    : null;

  useEffect(() => {
    if (!activeUpload) {
      return;
    }

    const currentSnapshot = activeUpload.snapshots[activeUpload.snapshotIndex];

    if (!currentSnapshot || currentSnapshot.status === "completed" || currentSnapshot.status === "failed") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveUpload((currentActiveUpload) => {
        if (!currentActiveUpload) {
          return null;
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

  function startUpload(name: string, shouldFail: boolean, documentId?: string) {
    const snapshots = createSnapshots(shouldFail);
    const document = createDocumentRecord(name, snapshots[0], documentId);

    setDocuments((currentDocuments) => [document, ...currentDocuments]);
    setActiveUpload({
      documentId: document.id,
      failedStage: shouldFail ? "embedding" : undefined,
      snapshotIndex: 0,
      snapshots
    });
  }

  async function handleFileAccepted(file: File) {
    setUploadError("");
    setUploadMessage(`Uploading ${file.name} to private S3 storage.`);

    const formData = new FormData();
    formData.append("file", file);

    let payload: UploadApiResponse | undefined;

    try {
      const response = await fetch("/api/documents/upload", {
        body: formData,
        method: "POST"
      });

      payload = (await response.json()) as UploadApiResponse;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Unable to upload your document right now.");
      }

      setUploadMessage(
        `${file.name} reached private S3 storage. Continuing through the mock parsing pipeline.`
      );
      startUpload(file.name, false, payload.data.documentId);
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
    startUpload("contracts-import-failure.md", true);
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
          isUploading={Boolean(
            activeDocument &&
              activeDocument.status !== "completed" &&
              activeDocument.status !== "failed"
          )}
          onFileAccepted={handleFileAccepted}
          onPreviewFailure={handlePreviewFailure}
          statusMessage={uploadMessage}
        />
        <Card
          eyebrow="History"
          title="Indexed document list"
          description="Successful uploads now hit the live S3-backed API before the local processing simulation takes over."
        >
          <DocumentTable documents={documents} />
        </Card>
      </div>
      <div className="space-y-6">
        <UploadProgressCard activeDocument={activeDocument} />
        <Card
          eyebrow="Stages"
          title="Processing timeline"
          description="This list follows the planned ingestion status model and highlights the active stage."
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

function createDocumentRecord(name: string, snapshot: UploadSnapshot, documentId?: string): DocumentRecord {
  return {
    id: documentId ?? `${name}-${Date.now()}`,
    name,
    processedChunks: snapshot.processedChunks,
    status: snapshot.status,
    totalChunks: 24,
    updatedAt: "Queued just now",
    uploadProgress: snapshot.uploadProgress,
    ...(snapshot.errorMessage ? { errorMessage: snapshot.errorMessage } : {})
  };
}
