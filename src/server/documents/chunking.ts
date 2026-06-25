import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_CHUNK_SIZE = 800;
export const DEFAULT_CHUNK_OVERLAP = 120;
const CONTENT_PREVIEW_LENGTH = 200;

type ChunkDocumentParams = {
  documentId: string;
  fileName: string;
  supabase: SupabaseClient;
  text: string;
  userId: string;
  chunkSize?: number;
  overlap?: number;
};

type ChunkRecord = {
  chunkIndex: number;
  content: string;
  contentPreview: string;
  pineconeVectorId: string;
  tokenCount: number;
};

type StoredChunkRow = {
  chunk_index: number;
};

export async function chunkDocument({
  documentId,
  fileName,
  supabase,
  text,
  userId,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_CHUNK_OVERLAP
}: ChunkDocumentParams) {
  await updateDocumentStatus(supabase, {
    documentId,
    errorMessage: null,
    status: "chunking",
    userId
  });

  try {
    const chunks = createDocumentChunks({
      chunkSize,
      documentId,
      fileName,
      overlap,
      text,
      userId
    });

    if (chunks.length === 0) {
      throw new Error("Parsed documents must contain enough text to create chunks.");
    }

    const deleteResult = await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId)
      .eq("user_id", userId);

    if (deleteResult.error) {
      throw new Error("Unable to clear existing document chunks.");
    }

    const insertResult = await supabase
      .from("document_chunks")
      .insert(
        chunks.map((chunk) => ({
          chunk_index: chunk.chunkIndex,
          content_preview: chunk.contentPreview,
          document_id: documentId,
          pinecone_vector_id: chunk.pineconeVectorId,
          token_count: chunk.tokenCount,
          user_id: userId
        }))
      )
      .select("chunk_index");

    if (insertResult.error || !insertResult.data) {
      throw new Error("Unable to insert document chunks.");
    }

    await updateDocumentProgress(supabase, {
      chunkingStrategy: {
        chunkSize,
        method: "whitespace-window",
        overlap
      },
      documentId,
      processedChunks: chunks.length,
      totalChunks: chunks.length,
      userId
    });

    return {
      chunks,
      insertedCount: (insertResult.data as StoredChunkRow[]).length
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to chunk the parsed document.";

    await updateDocumentStatus(supabase, {
      documentId,
      errorMessage: message,
      status: "failed",
      userId
    });

    throw new Error(message);
  }
}

export function createDocumentChunks(input: {
  chunkSize?: number;
  documentId: string;
  fileName: string;
  overlap?: number;
  text: string;
  userId: string;
}): ChunkRecord[] {
  const normalizedText = normalizeWhitespace(input.text);
  const chunkSize = input.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = input.overlap ?? DEFAULT_CHUNK_OVERLAP;

  if (!normalizedText) {
    return [];
  }

  if (chunkSize <= 0) {
    throw new Error("Chunk size must be greater than zero.");
  }

  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error("Chunk overlap must be zero or greater and smaller than the chunk size.");
  }

  const chunks: ChunkRecord[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < normalizedText.length) {
    let end = Math.min(start + chunkSize, normalizedText.length);

    if (end < normalizedText.length) {
      const boundary = normalizedText.lastIndexOf(" ", end);

      if (boundary > start + Math.floor(chunkSize / 2)) {
        end = boundary;
      }
    }

    const content = normalizedText.slice(start, end).trim();

    if (content) {
      chunks.push({
        chunkIndex,
        content,
        contentPreview: content.slice(0, CONTENT_PREVIEW_LENGTH),
        pineconeVectorId: `${input.userId}:${input.documentId}:${chunkIndex}`,
        tokenCount: estimateTokenCount(content)
      });
      chunkIndex += 1;
    }

    if (end >= normalizedText.length) {
      break;
    }

    start = Math.max(0, end - overlap);
  }

  return chunks;
}

async function updateDocumentStatus(
  supabase: SupabaseClient,
  input: {
    documentId: string;
    errorMessage: string | null;
    status: "chunking" | "failed";
    userId: string;
  }
) {
  const result = await supabase
    .from("documents")
    .update({
      error_message: input.errorMessage,
      status: input.status
    })
    .eq("id", input.documentId)
    .eq("user_id", input.userId);

  if (result.error) {
    throw new Error(`Unable to update document status to ${input.status}.`);
  }
}

async function updateDocumentProgress(
  supabase: SupabaseClient,
  input: {
    chunkingStrategy: {
      chunkSize: number;
      method: string;
      overlap: number;
    };
    documentId: string;
    processedChunks: number;
    totalChunks: number;
    userId: string;
  }
) {
  const result = await supabase
    .from("documents")
    .update({
      chunking_strategy_snapshot: input.chunkingStrategy,
      processed_chunks: input.processedChunks,
      total_chunks: input.totalChunks
    })
    .eq("id", input.documentId)
    .eq("user_id", input.userId);

  if (result.error) {
    throw new Error("Unable to update document chunk progress.");
  }
}

function normalizeWhitespace(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function estimateTokenCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}
