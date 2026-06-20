import { DocumentStatusBadge } from "./DocumentStatusBadge";

const stages = [
  "uploaded",
  "parsing",
  "chunking",
  "embedding",
  "indexing",
  "completed"
] as const;

export function ProcessingTimeline() {
  return (
    <ol className="space-y-3">
      {stages.map((stage, index) => (
        <li
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
          key={stage}
        >
          <div>
            <p className="font-medium capitalize text-ice-white">{stage}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Stage {index + 1}
            </p>
          </div>
          <DocumentStatusBadge status={stage} />
        </li>
      ))}
    </ol>
  );
}
