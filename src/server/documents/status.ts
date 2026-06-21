import type { SupabaseClient } from "@supabase/supabase-js";
import { parseDocumentStatusParams } from "@/lib/validations/documents";
import type { DocumentStatus } from "@/components/documents/types";

type DocumentStatusRow = {
  error_message: string | null;
  file_name: string;
  id: string;
  processed_chunks: number | null;
  status: DocumentStatus;
  total_chunks: number | null;
};

export type DocumentStatusSnapshot = {
  documentId: string;
  errorMessage?: string;
  fileName: string;
  processedChunks: number;
  status: DocumentStatus;
  totalChunks: number;
};

export async function getDocumentStatus(
  supabase: SupabaseClient,
  input: {
    documentId?: string;
    userId: string;
  }
): Promise<DocumentStatusSnapshot | null> {
  const { documentId } = parseDocumentStatusParams({
    documentId: input.documentId
  });

  const result = await supabase
    .from("documents")
    .select("id, file_name, status, processed_chunks, total_chunks, error_message")
    .eq("id", documentId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (result.error) {
    throw new Error("Unable to load the document status.");
  }

  const row = result.data as DocumentStatusRow | null;

  if (!row) {
    return null;
  }

  return {
    documentId: row.id,
    ...(row.error_message ? { errorMessage: row.error_message } : {}),
    fileName: row.file_name,
    processedChunks: row.processed_chunks ?? 0,
    status: row.status,
    totalChunks: row.total_chunks ?? 0
  };
}
