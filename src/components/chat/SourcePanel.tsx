import { Card } from "@/components/ui/Card";

type SourcePanelProps = {
  sources: Array<{ title: string; detail: string }>;
};

export function SourcePanel({ sources }: SourcePanelProps) {
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
