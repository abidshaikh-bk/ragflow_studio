import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentStatus } from "@/components/documents/types";

type DocumentListRow = {
  embedding_model_snapshot: Record<string, unknown> | null;
  error_message: string | null;
  file_name: string;
  file_size: number;
  file_type: string;
  id: string;
  indexing_snapshot: Record<string, unknown> | null;
  processed_chunks: number | null;
  status: DocumentStatus;
  total_chunks: number | null;
  updated_at: string;
};

export type ListedDocument = {
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
};

export async function listUserDocuments(
  supabase: SupabaseClient,
  userId: string
): Promise<ListedDocument[]> {
  const result = await supabase
    .from("documents")
    .select(
      "id, file_name, file_size, file_type, status, processed_chunks, total_chunks, error_message, updated_at, embedding_model_snapshot, indexing_snapshot"
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (result.error) {
    throw new Error("Unable to load the document list.");
  }

  const rows = (result.data ?? []) as DocumentListRow[];

  return rows.map((row) => ({
    documentId: row.id,
    ...(row.error_message ? { errorMessage: row.error_message } : {}),
    fileName: row.file_name,
    fileSize: row.file_size,
    fileType: row.file_type,
    ...(row.indexing_snapshot
      ? {
          indexingState: {
            ...(typeof row.embedding_model_snapshot?.provider === "string"
              ? { provider: row.embedding_model_snapshot.provider }
              : {}),
            vectorCount:
              typeof row.indexing_snapshot.vectorCount === "number"
                ? row.indexing_snapshot.vectorCount
                : row.processed_chunks ?? 0
          }
        }
      : {}),
    processedChunks: row.processed_chunks ?? 0,
    status: row.status,
    totalChunks: row.total_chunks ?? 0,
    updatedAt: row.updated_at
  }));
}
