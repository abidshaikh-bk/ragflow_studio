import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getProviderCredentialSecret,
  getUserSettings
} from "@/server/settings/service";

export const DEFAULT_EMBEDDING_BATCH_SIZE = 20;
const DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

export type EmbeddingChunk = {
  chunkIndex: number;
  content: string;
  contentPreview: string;
  pineconeVectorId: string;
  tokenCount: number;
};

export type EmbeddingVector = {
  chunkIndex: number;
  values: number[];
};

export type EmbeddingConfig = {
  apiKey: string;
  model: string;
  provider: string;
};

const MVP_SUPPORTED_EMBEDDING_PROVIDERS = new Set(["openai"]);

type GenerateEmbeddingsParams = {
  chunks: EmbeddingChunk[];
  documentId: string;
  supabase: SupabaseClient;
  userId: string;
  batchSize?: number;
};

export type Embedder = (input: {
  model: string;
  provider: string;
  texts: string[];
}) => Promise<number[][]>;

export async function generateDocumentEmbeddings(
  {
    chunks,
    documentId,
    supabase,
    userId,
    batchSize = DEFAULT_EMBEDDING_BATCH_SIZE
  }: GenerateEmbeddingsParams,
  embedder: Embedder = embedTexts
) {
  if (chunks.length === 0) {
    throw new Error("Document chunks are required before generating embeddings.");
  }

  await updateDocumentStatus(supabase, {
    documentId,
    errorMessage: null,
    status: "embedding",
    userId
  });

  try {
    const config = await resolveEmbeddingConfig(supabase, userId);
    const vectors: EmbeddingVector[] = [];
    const runtimeEmbedder =
      embedder === embedTexts
        ? (input: { model: string; provider: string; texts: string[] }) =>
            embedTexts({
              ...input,
              apiKey: config.apiKey
            })
        : embedder;

    for (let index = 0; index < chunks.length; index += batchSize) {
      const batch = chunks.slice(index, index + batchSize);
      const values = await runtimeEmbedder({
        model: config.model,
        provider: config.provider,
        texts: batch.map((chunk) => chunk.content)
      });

      if (values.length !== batch.length) {
        throw new Error("Embedding provider returned an unexpected number of vectors.");
      }

      batch.forEach((chunk, batchIndex) => {
        vectors.push({
          chunkIndex: chunk.chunkIndex,
          values: values[batchIndex] ?? []
        });
      });

      await updateProcessedChunkCount(supabase, {
        documentId,
        processedChunks: Math.min(index + batch.length, chunks.length),
        userId
      });
    }

    return {
      config,
      vectors
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate embeddings for the document.";

    await updateDocumentStatus(supabase, {
      documentId,
      errorMessage: message,
      status: "failed",
      userId
    });

    throw new Error(message);
  }
}

export async function embedTexts(input: {
  apiKey?: string;
  model: string;
  provider: string;
  texts: string[];
}) {
  if (!MVP_SUPPORTED_EMBEDDING_PROVIDERS.has(input.provider)) {
    throw new Error(`Unsupported embedding provider for MVP: ${input.provider}.`);
  }

  const apiKey = input.apiKey || getProviderApiKeyFromEnv(input.provider);

  if (!apiKey) {
    throw new Error(`Missing required API key for embedding provider: ${input.provider}`);
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    body: JSON.stringify({
      input: input.texts,
      model: input.model
    }),
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    method: "POST"
  });

  const payload = (await response.json()) as {
    data?: Array<{ embedding: number[] }>;
    error?: { message?: string };
  };

  if (!response.ok || !payload.data) {
    throw new Error(
      payload.error?.message || "The embedding provider rejected the request."
    );
  }

  return payload.data.map((item) => item.embedding);
}

export async function resolveEmbeddingConfig(
  supabase: SupabaseClient,
  userId: string
): Promise<EmbeddingConfig> {
  const userSettings = await getUserSettings(supabase, userId);
  const defaultProvider =
    getSupportedEmbeddingProvider(process.env.DEFAULT_EMBEDDING_PROVIDER) || "openai";
  const defaultModel =
    process.env.DEFAULT_EMBEDDING_MODEL || DEFAULT_OPENAI_EMBEDDING_MODEL;
  const requestedProvider = userSettings.embeddingProvider?.trim().toLowerCase();
  const requestedModel = userSettings.embeddingModel?.trim();
  const provider = getSupportedEmbeddingProvider(requestedProvider) ?? defaultProvider;
  const model =
    provider === requestedProvider && requestedModel ? requestedModel : defaultModel;
  const apiKey =
    provider === requestedProvider
      ? await getProviderCredentialSecret(supabase, {
          label: "default-embedding",
          provider,
          userId
        })
      : null;
  const fallbackApiKey = getProviderApiKeyFromEnv(provider);
  const resolvedApiKey = apiKey ?? fallbackApiKey;

  if (!resolvedApiKey) {
    throw new Error(`Missing required API key for embedding provider: ${provider}`);
  }

  return {
    apiKey: resolvedApiKey,
    model,
    provider
  };
}

function getSupportedEmbeddingProvider(provider?: string | null) {
  if (!provider) {
    return null;
  }

  return MVP_SUPPORTED_EMBEDDING_PROVIDERS.has(provider) ? provider : null;
}

function getProviderApiKeyFromEnv(provider: string) {
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY || null;
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY || null;
    case "gemini":
      return process.env.GEMINI_API_KEY || null;
    case "huggingface":
      return process.env.HUGGINGFACE_API_KEY || null;
    default:
      return null;
  }
}

async function updateDocumentStatus(
  supabase: SupabaseClient,
  input: {
    documentId: string;
    errorMessage: string | null;
    status: "embedding" | "failed";
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

async function updateProcessedChunkCount(
  supabase: SupabaseClient,
  input: {
    documentId: string;
    processedChunks: number;
    userId: string;
  }
) {
  const result = await supabase
    .from("documents")
    .update({
      processed_chunks: input.processedChunks
    })
    .eq("id", input.documentId)
    .eq("user_id", input.userId);

  if (result.error) {
    throw new Error("Unable to update document embedding progress.");
  }
}
