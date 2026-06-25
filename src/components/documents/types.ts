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
  fileSize?: number;
  fileType?: string;
  indexingState?: {
    provider?: string;
    vectorCount: number;
  };
};

export type DocumentDetailRecord = {
  chunkingStrategy: {
    chunkCount: number;
    chunkSize: number | null;
    method: string;
    overlap: number | null;
  };
  createdAt: string;
  documentId: string;
  embedding: {
    batchSize: number | null;
    dimensions: number | null;
    model: string | null;
    provider: string | null;
  };
  errorMessage?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  indexing: {
    indexedAt: string | null;
    namespace: string;
    vectorCount: number;
  };
  processedChunks: number;
  status: DocumentStatus;
  totalChunks: number;
  updatedAt: string;
};

export type DocumentChunkRecord = {
  chunkIndex: number;
  contentPreview: string;
  createdAt: string;
  id: string;
  pineconeVectorId: string;
  tokenCount: number;
};

export type DocumentEmbeddingsRecord = {
  documentId: string;
  dimensions: number | null;
  model: string | null;
  namespace: string;
  provider: string | null;
  vectorCount: number;
  vectors: Array<{
    chunkIndex: number;
    contentPreview: string;
    pineconeVectorId: string;
    tokenCount: number;
  }>;
};

export function isTerminalDocumentStatus(status: DocumentStatus) {
  return status === "completed" || status === "failed";
}
