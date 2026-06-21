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

  return indexDocumentEmbeddings(
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
}
