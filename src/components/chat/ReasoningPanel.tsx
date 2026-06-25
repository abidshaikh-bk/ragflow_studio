import { Card } from "@/components/ui/Card";
import type { ChatReasoningStep } from "./types";

export function ReasoningPanel({
  reasoning
}: {
  reasoning: ChatReasoningStep[];
}) {
  return (
    <Card eyebrow="Reasoning" title="Timeline">
      {reasoning.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-300">
          Normalized reasoning steps will appear here while the assistant works.
        </div>
      ) : (
        <div className="space-y-3">
          {reasoning.map((step) => (
            <div
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              key={step.id}
            >
              <p className="font-medium text-ice-white">{step.label}</p>
              <p className="mt-2 text-sm text-slate-300">{step.detail}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
