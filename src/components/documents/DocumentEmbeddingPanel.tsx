import { Card } from "@/components/ui/Card";
import type { DocumentEmbeddingsRecord } from "./types";

export function DocumentEmbeddingPanel({
  embeddings
}: {
  embeddings: DocumentEmbeddingsRecord;
}) {
  return (
    <Card
      eyebrow="Embeddings"
      title="Vector and index metadata"
      description="This panel reflects the server-side embedding snapshot and Pinecone namespace used for this document."
    >
      <dl className="grid gap-4 md:grid-cols-2">
        <Metric label="Provider" value={embeddings.provider ?? "Not recorded"} />
        <Metric label="Model" value={embeddings.model ?? "Not recorded"} />
        <Metric
          label="Dimensions"
          value={embeddings.dimensions ? String(embeddings.dimensions) : "Not recorded"}
        />
        <Metric label="Vectors" value={String(embeddings.vectorCount)} />
        <Metric label="Namespace" value={embeddings.namespace} mono />
        <Metric
          label="Vector preview coverage"
          value={`${embeddings.vectors.length} chunk records`}
        />
      </dl>
    </Card>
  );
}

function Metric(input: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
      <dt className="text-xs uppercase tracking-[0.22em] text-slate-400">{input.label}</dt>
      <dd
        className={`mt-2 text-sm text-ice-white ${input.mono ? "font-mono break-all" : ""}`}
      >
        {input.value}
      </dd>
    </div>
  );
}
