import type { SupabaseClient } from "@supabase/supabase-js";
import { parseVectorSearchInput } from "@/lib/validations/vector-search";
import {
  embedTexts,
  resolveEmbeddingConfig,
  type Embedder
} from "@/server/embeddings/service";
import { createPineconeQueryClient } from "@/server/pinecone/client";
import type {
  PineconeMetadata,
  PineconeQueryClient,
  PineconeQueryMatch
} from "@/server/pinecone/indexing";

export type VectorSearchMatch = {
  chunkIndex: number;
  contentPreview: string;
  documentId: string;
  fileName: string;
  id: string;
  score: number | null;
};

type VectorSearchParams = {
  documentIds?: string[];
  query: string;
  sessionId?: string;
  supabase: SupabaseClient;
  topK?: number;
  userId: string;
};

type VectorSearchDeps = {
  embedder: Embedder;
  pineconeClient: PineconeQueryClient;
};

export async function queryDocumentVectors(
  {
    documentIds,
    query,
    sessionId,
    supabase,
    topK,
    userId
  }: VectorSearchParams,
  deps?: Partial<VectorSearchDeps>
) {
  const input = parseVectorSearchInput({
    documentIds,
    query,
    topK
  });
  const startedAt = Date.now();

  try {
    const config = await resolveEmbeddingConfig(supabase, userId);
    const embedder = deps?.embedder ?? embedTexts;
    const pineconeClient = deps?.pineconeClient ?? createPineconeQueryClient();
    const [vector] = await embedder({
      model: config.model,
      provider: config.provider,
      texts: [input.query]
    });

    if (!vector) {
      throw new Error("The embedding provider did not return a query vector.");
    }

    const response = await pineconeClient.query({
      ...(input.documentIds?.length
        ? {
            filter: {
              documentId: {
                $in: input.documentIds
              }
            }
          }
        : {}),
      includeMetadata: true,
      namespace: `user:${userId}`,
      topK: input.topK,
      vector
    });
    const matches = response.matches.map(mapQueryMatch);

    await logToolCall(supabase, {
      input,
      latencyMs: Date.now() - startedAt,
      output: {
        matchCount: matches.length,
        matches
      },
      sessionId,
      status: "success",
      userId
    });

    return {
      matches
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to query document vectors.";

    await logToolCall(supabase, {
      input,
      latencyMs: Date.now() - startedAt,
      output: {
        error: message
      },
      sessionId,
      status: "failed",
      userId
    });

    throw new Error(message);
  }
}

function mapQueryMatch(match: PineconeQueryMatch): VectorSearchMatch {
  const metadata = match.metadata as PineconeMetadata | undefined;

  if (!metadata) {
    throw new Error("Pinecone query results did not include metadata.");
  }

  return {
    chunkIndex: metadata.chunkIndex,
    contentPreview: metadata.contentPreview,
    documentId: metadata.documentId,
    fileName: metadata.fileName,
    id: match.id,
    score: match.score ?? null
  };
}

async function logToolCall(
  supabase: SupabaseClient,
  input: {
    input: {
      documentIds?: string[];
      query: string;
      topK: number;
    };
    latencyMs: number;
    output: object;
    sessionId?: string;
    status: string;
    userId: string;
  }
) {
  if (!input.sessionId) {
    return;
  }

  const result = await supabase.from("agent_tool_calls").insert({
    latency_ms: input.latencyMs,
    session_id: input.sessionId,
    status: input.status,
    tool_input: input.input,
    tool_name: "pinecone.query",
    tool_output: input.output,
    user_id: input.userId
  });

  if (result.error) {
    throw new Error("Unable to log the vector search tool call.");
  }
}
