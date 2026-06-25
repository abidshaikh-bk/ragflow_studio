import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentAccessAction } from "@/lib/validations/documents";
import { createS3ObjectAccessLink } from "@/server/s3/client";

type DocumentRow = {
  chunking_strategy_snapshot: Record<string, unknown> | null;
  created_at: string;
  embedding_model_snapshot: Record<string, unknown> | null;
  error_message: string | null;
  file_name: string;
  file_size: number;
  file_type: string;
  id: string;
  indexing_snapshot: Record<string, unknown> | null;
  pinecone_namespace: string;
  processed_chunks: number;
  s3_key: string;
  status: string;
  total_chunks: number;
  updated_at: string;
};

type ChunkRow = {
  content_preview: string | null;
  created_at: string;
  id: string;
  chunk_index: number;
  pinecone_vector_id: string;
  token_count: number | null;
};

export type DocumentSummary = {
  chunkCount: number;
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
  status: string;
  updatedAt: string;
};

export type DocumentDetail = {
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
  status: string;
  totalChunks: number;
  updatedAt: string;
};

export type DocumentChunkDetail = {
  chunkIndex: number;
  contentPreview: string;
  createdAt: string;
  id: string;
  pineconeVectorId: string;
  tokenCount: number;
};

export type DocumentEmbeddingsDetail = {
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

export async function getDocumentDetail(
  supabase: SupabaseClient,
  input: {
    documentId: string;
    userId: string;
  }
): Promise<DocumentDetail | null> {
  const row = await getOwnedDocumentRow(supabase, input);

  if (!row) {
    return null;
  }

  return toDocumentDetail(row);
}

export async function getDocumentChunks(
  supabase: SupabaseClient,
  input: {
    documentId: string;
    userId: string;
  }
): Promise<DocumentChunkDetail[] | null> {
  const row = await getOwnedDocumentRow(supabase, input);

  if (!row) {
    return null;
  }

  const result = await supabase
    .from("document_chunks")
    .select("id, chunk_index, content_preview, token_count, pinecone_vector_id, created_at")
    .eq("document_id", input.documentId)
    .eq("user_id", input.userId)
    .order("chunk_index", { ascending: true });

  if (result.error) {
    throw new Error("Unable to load the document chunks.");
  }

  return ((result.data as ChunkRow[] | null) ?? []).map((chunk) => ({
    chunkIndex: chunk.chunk_index,
    contentPreview: chunk.content_preview ?? "",
    createdAt: chunk.created_at,
    id: chunk.id,
    pineconeVectorId: chunk.pinecone_vector_id,
    tokenCount: chunk.token_count ?? 0
  }));
}

export async function getDocumentEmbeddings(
  supabase: SupabaseClient,
  input: {
    documentId: string;
    userId: string;
  }
): Promise<DocumentEmbeddingsDetail | null> {
  const row = await getOwnedDocumentRow(supabase, input);

  if (!row) {
    return null;
  }

  const chunks = await getDocumentChunks(supabase, input);

  if (!chunks) {
    return null;
  }

  const embeddingSnapshot = row.embedding_model_snapshot ?? {};
  const indexingSnapshot = row.indexing_snapshot ?? {};

  return {
    dimensions: readNullableNumber(embeddingSnapshot.dimensions),
    documentId: row.id,
    model: readNullableString(embeddingSnapshot.model),
    namespace: row.pinecone_namespace,
    provider: readNullableString(embeddingSnapshot.provider),
    vectorCount:
      readNullableNumber(indexingSnapshot.vectorCount) ?? Math.max(row.processed_chunks, chunks.length),
    vectors: chunks.map((chunk) => ({
      chunkIndex: chunk.chunkIndex,
      contentPreview: chunk.contentPreview,
      pineconeVectorId: chunk.pineconeVectorId,
      tokenCount: chunk.tokenCount
    }))
  };
}

export async function createDocumentAccessLink(
  supabase: SupabaseClient,
  input: {
    action: DocumentAccessAction;
    documentId: string;
    userId: string;
  }
) {
  const row = await getOwnedDocumentRow(supabase, {
    documentId: input.documentId,
    userId: input.userId
  });

  if (!row) {
    return null;
  }

  return createS3ObjectAccessLink({
    action: input.action,
    fileName: row.file_name,
    fileType: row.file_type,
    key: row.s3_key
  });
}

async function getOwnedDocumentRow(
  supabase: SupabaseClient,
  input: {
    documentId: string;
    userId: string;
  }
) {
  const result = await supabase
    .from("documents")
    .select(
      "id, file_name, file_type, file_size, s3_key, status, error_message, total_chunks, processed_chunks, pinecone_namespace, embedding_model_snapshot, chunking_strategy_snapshot, indexing_snapshot, created_at, updated_at"
    )
    .eq("id", input.documentId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (result.error) {
    throw new Error("Unable to load the document detail.");
  }

  return (result.data as DocumentRow | null) ?? null;
}

function toDocumentDetail(row: DocumentRow): DocumentDetail {
  const chunkingSnapshot = row.chunking_strategy_snapshot ?? {};
  const embeddingSnapshot = row.embedding_model_snapshot ?? {};
  const indexingSnapshot = row.indexing_snapshot ?? {};

  return {
    chunkingStrategy: {
      chunkCount: row.total_chunks,
      chunkSize: readNullableNumber(chunkingSnapshot.chunkSize),
      method: readNullableString(chunkingSnapshot.method) ?? "whitespace-window",
      overlap: readNullableNumber(chunkingSnapshot.overlap)
    },
    createdAt: row.created_at,
    documentId: row.id,
    embedding: {
      batchSize: readNullableNumber(embeddingSnapshot.batchSize),
      dimensions: readNullableNumber(embeddingSnapshot.dimensions),
      model: readNullableString(embeddingSnapshot.model),
      provider: readNullableString(embeddingSnapshot.provider)
    },
    ...(row.error_message ? { errorMessage: row.error_message } : {}),
    fileName: row.file_name,
    fileSize: row.file_size,
    fileType: row.file_type,
    indexing: {
      indexedAt: readNullableString(indexingSnapshot.indexedAt),
      namespace: row.pinecone_namespace,
      vectorCount:
        readNullableNumber(indexingSnapshot.vectorCount) ?? row.processed_chunks
    },
    processedChunks: row.processed_chunks,
    status: row.status,
    totalChunks: row.total_chunks,
    updatedAt: row.updated_at
  };
}

function readNullableString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
