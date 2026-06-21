import { Card } from "@/components/ui/Card";

type SourcePanelProps = {
  sources: Array<{ title: string; detail: string }>;
};

export function SourcePanel({ sources }: SourcePanelProps) {
  if (sources.length === 0) {
    return (
      <Card eyebrow="Context" title="Sources">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-300">
          Retrieved document chunks will appear here after the assistant answers.
        </div>
      </Card>
    );
  }

  return (
    <Card eyebrow="Context" title="Sources">
      <div className="space-y-3">
        {sources.map((source) => (
          <div
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
            key={source.title}
          >
            <p className="font-medium text-ice-white">{source.title}</p>
            <p className="mt-2 text-sm text-slate-300">{source.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
