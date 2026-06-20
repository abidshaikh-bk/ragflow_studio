import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

type ToolActivityPanelProps = {
  items: string[];
};

export function ToolActivityPanel({ items }: ToolActivityPanelProps) {
  return (
    <Card eyebrow="Tools" title="Activity">
      <div className="space-y-3">
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
    </Card>
  );
}
