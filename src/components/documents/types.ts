export const processingStages = [
  "uploaded",
  "parsing",
  "chunking",
  "embedding",
  "indexing",
  "completed"
] as const;

export type DocumentStatus = (typeof processingStages)[number] | "failed";

export type DocumentRecord = {
  id: string;
  name: string;
  status: DocumentStatus;
  totalChunks: number;
  processedChunks: number;
  uploadProgress: number;
  errorMessage?: string;
  updatedAt: string;
};

export function isTerminalDocumentStatus(status: DocumentStatus) {
  return status === "completed" || status === "failed";
}
