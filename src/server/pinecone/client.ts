import { Pinecone } from "@pinecone-database/pinecone";
import { getPineconeEnv } from "@/lib/env";
import type {
  PineconeQueryClient,
  PineconeQueryMatch,
  PineconeMetadata,
  PineconeUpsertClient,
  PineconeVector
} from "@/server/pinecone/indexing";

type PineconeIndexClient = {
  query: (input: {
    filter?: object;
    includeMetadata: boolean;
    namespace: string;
    topK: number;
    vector: number[];
  }) => Promise<{
    matches: PineconeQueryMatch[];
  }>;
  upsert: (input: {
    namespace: string;
    records: Array<{
      id: string;
      metadata: PineconeMetadata;
      values: number[];
    }>;
  }) => Promise<void>;
};

export function createPineconeUpsertClient(): PineconeUpsertClient {
  const { apiKey, indexName } = getPineconeEnv();
  const pinecone = new Pinecone({ apiKey });
  let indexClientPromise: Promise<PineconeIndexClient> | null = null;

  return {
    async upsert(input) {
      const index = await resolveIndexClient();

      await index.upsert({
        namespace: input.namespace,
        records: input.vectors.map(toPineconeRecord)
      });
    }
  };

  function resolveIndexClient() {
    if (!indexClientPromise) {
      indexClientPromise = pinecone.describeIndex(indexName).then((indexModel) =>
        pinecone.index({ host: indexModel.host })
      );
    }

    return indexClientPromise;
  }
}

export function createPineconeQueryClient(): PineconeQueryClient {
  const { apiKey, indexName } = getPineconeEnv();
  const pinecone = new Pinecone({ apiKey });
  let indexClientPromise: Promise<PineconeIndexClient> | null = null;

  return {
    async query(input) {
      const index = await resolveIndexClient();
      const response = await index.query({
        ...(input.filter ? { filter: input.filter } : {}),
        includeMetadata: input.includeMetadata,
        namespace: input.namespace,
        topK: input.topK,
        vector: input.vector
      });

      return {
        matches: response.matches
      };
    }
  };

  function resolveIndexClient() {
    if (!indexClientPromise) {
      indexClientPromise = pinecone.describeIndex(indexName).then((indexModel) =>
        pinecone.index({ host: indexModel.host })
      );
    }

    return indexClientPromise;
  }
}

function toPineconeRecord(vector: PineconeVector) {
  return {
    id: vector.id,
    metadata: vector.metadata,
    values: vector.values
  };
}
