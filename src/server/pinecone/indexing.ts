import type { SupabaseClient } from "@supabase/supabase-js";

export type EmbeddingVector = {
  chunkIndex: number;
  values: number[];
};

export type SourceChunk = {
  chunkIndex: number;
  contentPreview: string;
  pineconeVectorId: string;
};

export type PineconeMetadata = {
  chunkIndex: number;
  contentPreview: string;
  documentId: string;
  fileName: string;
  userId: string;
};

export type PineconeVector = {
  id: string;
  values: number[];
  metadata: PineconeMetadata;
};

export type PineconeQueryMatch = {
  id: string;
  metadata?: PineconeMetadata;
  score?: number;
};

export type PineconeUpsertClient = {
  upsert: (input: {
    namespace: string;
    vectors: PineconeVector[];
  }) => Promise<void>;
};

export type PineconeQueryClient = {
  query: (input: {
    filter?: object;
    includeMetadata: boolean;
    namespace: string;
    topK: number;
    vector: number[];
  }) => Promise<{
    matches: PineconeQueryMatch[];
  }>;
};

type IndexDocumentEmbeddingsParams = {
  documentId: string;
  fileName: string;
  supabase: SupabaseClient;
  userId: string;
  chunks: SourceChunk[];
  vectors: EmbeddingVector[];
};

export async function indexDocumentEmbeddings(
  {
    documentId,
    fileName,
    supabase,
    userId,
    chunks,
    vectors
  }: IndexDocumentEmbeddingsParams,
  pineconeClient: PineconeUpsertClient
) {
  if (vectors.length === 0) {
    throw new Error("Embedding vectors are required before Pinecone indexing.");
  }

  await updateDocumentStatus(supabase, {
    documentId,
    errorMessage: null,
    status: "indexing",
    userId
  });

  try {
    const namespace = `user:${userId}`;
    const pineconeVectors = buildPineconeVectors({
      chunks,
      documentId,
      fileName,
      userId,
      vectors
    });

    await pineconeClient.upsert({
      namespace,
      vectors: pineconeVectors
    });

    await updateDocumentCompletion(supabase, {
      documentId,
      namespace,
      processedChunks: pineconeVectors.length,
      totalChunks: pineconeVectors.length,
      userId
    });

    return {
      namespace,
      vectorCount: pineconeVectors.length
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to index document embeddings in Pinecone.";

    await updateDocumentStatus(supabase, {
      documentId,
      errorMessage: message,
      status: "failed",
      userId
    });

    throw new Error(message);
  }
}

export function buildPineconeVectors(input: {
  chunks: SourceChunk[];
  documentId: string;
  fileName: string;
  userId: string;
  vectors: EmbeddingVector[];
}): PineconeVector[] {
  const chunksByIndex = new Map(input.chunks.map((chunk) => [chunk.chunkIndex, chunk]));

  return input.vectors.map((vector) => {
    const chunk = chunksByIndex.get(vector.chunkIndex);

    if (!chunk) {
      throw new Error(`Missing chunk metadata for chunk index ${vector.chunkIndex}.`);
    }

    return {
      id: chunk.pineconeVectorId,
      metadata: {
        chunkIndex: vector.chunkIndex,
        contentPreview: chunk.contentPreview,
        documentId: input.documentId,
        fileName: input.fileName,
        userId: input.userId
      },
      values: vector.values
    };
  });
}

async function updateDocumentStatus(
  supabase: SupabaseClient,
  input: {
    documentId: string;
    errorMessage: string | null;
    status: "indexing" | "failed";
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

async function updateDocumentCompletion(
  supabase: SupabaseClient,
  input: {
    documentId: string;
    namespace?: string;
    processedChunks: number;
    totalChunks: number;
    userId: string;
  }
) {
  const result = await supabase
    .from("documents")
    .update({
      indexing_snapshot: {
        indexedAt: new Date().toISOString(),
        namespace: input.namespace,
        vectorCount: input.totalChunks
      },
      processed_chunks: input.processedChunks,
      status: "completed",
      total_chunks: input.totalChunks
    })
    .eq("id", input.documentId)
    .eq("user_id", input.userId);

  if (result.error) {
    throw new Error("Unable to mark the document completed after Pinecone indexing.");
  }
}
