import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

type ToolActivityPanelProps = {
  items: string[];
  loading?: boolean;
};

export function ToolActivityPanel({
  items,
  loading = false
}: ToolActivityPanelProps) {
  return (
    <Card eyebrow="Tools" title="Activity">
      {items.length === 0 && !loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-300">
          Tool calls will appear here when retrieval and other helpers run.
        </div>
      ) : (
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-aqua/20 bg-aqua/5 px-4 py-3">
              <Badge tone="info">tool</Badge>
              <p className="mt-2 text-sm text-slate-200">
                pinecone.query - searching your documents
              </p>
            </div>
          ) : null}
          {items.map((item) => (
            <div
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              key={item}
            >
              <Badge tone="info">tool</Badge>
              <p className="mt-2 text-sm text-slate-200">{item}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
