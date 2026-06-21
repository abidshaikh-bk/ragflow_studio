import { Badge } from "@/components/ui/Badge";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { processingStages, type DocumentStatus } from "./types";

type ProcessingTimelineProps = {
  currentStatus: DocumentStatus;
  failedStage?: Exclude<DocumentStatus, "completed" | "failed">;
};

export function ProcessingTimeline({
  currentStatus,
  failedStage
}: ProcessingTimelineProps) {
  const currentIndex = processingStages.indexOf(
    currentStatus === "failed" ? (failedStage ?? "uploaded") : currentStatus
  );

  return (
    <ol className="space-y-3">
      {processingStages.map((stage, index) => {
        const isFailedStage = currentStatus === "failed" && failedStage === stage;
        const isCurrentStage = !isFailedStage && index === currentIndex;
        const isCompletedStage = !isFailedStage && index < currentIndex;

        return (
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
          {isFailedStage ? (
            <DocumentStatusBadge status="failed" />
          ) : isCurrentStage ? (
            <DocumentStatusBadge status={stage} />
          ) : isCompletedStage ? (
            <Badge tone="success">done</Badge>
          ) : (
            <Badge>queued</Badge>
          )}
        </li>
        );
      })}
    </ol>
  );
}
