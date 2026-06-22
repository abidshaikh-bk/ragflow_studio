import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type Embedder,
  generateDocumentEmbeddings
} from "@/server/embeddings/service";
import { chunkDocument } from "@/server/documents/chunking";
import { parseDocument } from "@/server/documents/parser";
import { createPineconeUpsertClient } from "@/server/pinecone/client";
import {
  indexDocumentEmbeddings,
  type PineconeUpsertClient
} from "@/server/pinecone/indexing";
import { appEventLogger } from "@/server/logging/events";

type ProcessUploadedDocumentParams = {
  documentId: string;
  fileContents: Buffer | Uint8Array | string;
  fileName: string;
  fileType: string;
  supabase: SupabaseClient;
  userId: string;
};

type ProcessUploadedDocumentDeps = {
  embedder: Embedder;
  pineconeClient: PineconeUpsertClient;
};

export async function processUploadedDocument(
  {
    documentId,
    fileContents,
    fileName,
    fileType,
    supabase,
    userId
  }: ProcessUploadedDocumentParams,
  deps?: Partial<ProcessUploadedDocumentDeps>
) {
  const startedAt = Date.now();

  appEventLogger.info({
    documentId,
    event: "documents.processing.started",
    metadata: {
      fileName,
      fileType
    },
    userId
  });

  try {
    const parsedDocument = await parseDocument({
      documentId,
      fileContents,
      fileName,
      fileType,
      supabase,
      userId
    });

    const chunkedDocument = await chunkDocument({
      documentId,
      fileName,
      supabase,
      text: parsedDocument.text,
      userId
    });

    const embeddingResult = await generateDocumentEmbeddings(
      {
        chunks: chunkedDocument.chunks,
        documentId,
        supabase,
        userId
      },
      deps?.embedder
    );
    const indexingResult = await indexDocumentEmbeddings(
      {
        chunks: chunkedDocument.chunks,
        documentId,
        fileName,
        supabase,
        userId,
        vectors: embeddingResult.vectors
      },
      deps?.pineconeClient ?? createPineconeUpsertClient()
    );

    appEventLogger.info({
      documentId,
      durationMs: Date.now() - startedAt,
      event: "documents.processing.completed",
      metadata: {
        chunkCount: chunkedDocument.chunks.length,
        namespace: indexingResult.namespace,
        vectorCount: indexingResult.vectorCount
      },
      userId
    });

    return indexingResult;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to process the uploaded document.";

    appEventLogger.error({
      documentId,
      durationMs: Date.now() - startedAt,
      errorMessage: message,
      event: "documents.processing.failed",
      metadata: {
        fileName,
        fileType
      },
      userId
    });

    throw error;
  }
}
