import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Toast } from "@/components/ui/Toast";
import type { DocumentRecord } from "./types";

type UploadProgressCardProps = {
  activeDocument: DocumentRecord | null;
};

export function UploadProgressCard({ activeDocument }: UploadProgressCardProps) {
  if (!activeDocument) {
    return (
      <Card
        eyebrow="Live processing"
        title="Pipeline status"
        description="Uploaded files will move through parsing, chunking, embedding, and indexing here."
      >
        <Toast
          message="Choose a supported document to preview the live ingestion states before the backend pipeline is wired."
          title="Waiting for an upload"
        />
      </Card>
    );
  }

  const chunkProgress =
    activeDocument.totalChunks === 0
      ? 0
      : activeDocument.processedChunks / activeDocument.totalChunks;

  const isFailed = activeDocument.status === "failed";
  const isCompleted = activeDocument.status === "completed";

  return (
    <Card
      eyebrow="Live processing"
      title="Pipeline status"
      description="Uploaded files will move through parsing, chunking, embedding, and indexing here."
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-ice-white">Current stage</p>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-aqua">
            {activeDocument.status}
          </p>
          <p className="text-sm text-slate-300">{activeDocument.name}</p>
        </div>
        <Progress label="Upload progress" value={activeDocument.uploadProgress} />
        <Progress
          label="Chunk progress"
          max={activeDocument.totalChunks}
          value={activeDocument.processedChunks}
        />
        <Toast
          message={
            isFailed
              ? activeDocument.errorMessage ?? "Document processing failed."
              : isCompleted
                ? "Document processing completed and the file is ready for retrieval tasks."
                : `Processed ${activeDocument.processedChunks} of ${activeDocument.totalChunks} chunks in the mock pipeline.`
          }
          title={
            isFailed
              ? "Processing failed"
              : isCompleted
                ? "Processing completed"
                : "Pipeline running"
          }
          tone={isCompleted ? "success" : "info"}
        />
      </div>
    </Card>
  );
}
