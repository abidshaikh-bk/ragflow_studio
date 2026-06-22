import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentStatus } from "@/components/documents/types";

type DocumentListRow = {
  error_message: string | null;
  file_name: string;
  id: string;
  processed_chunks: number | null;
  status: DocumentStatus;
  total_chunks: number | null;
  updated_at: string;
};

export type ListedDocument = {
  documentId: string;
  errorMessage?: string;
  fileName: string;
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
      "id, file_name, status, processed_chunks, total_chunks, error_message, updated_at"
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
    processedChunks: row.processed_chunks ?? 0,
    status: row.status,
    totalChunks: row.total_chunks ?? 0,
    updatedAt: row.updated_at
  }));
}
