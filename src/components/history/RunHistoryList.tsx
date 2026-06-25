"use client";

import type { HistoryRunSummary } from "./types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type RunHistoryListProps = {
  runs: HistoryRunSummary[];
  selectedSessionId: string | null;
  onSelect: (sessionId: string) => void;
};

export function RunHistoryList({
  onSelect,
  runs,
  selectedSessionId
}: RunHistoryListProps) {
  return (
    <Card
      description="Each row summarizes the latest prompt, reply, tool activity, and trace identifier for one saved session."
      eyebrow="Run history"
      title="Recent sessions"
    >
      <div className="space-y-4">
        {runs.map((run) => {
          const isActive = run.sessionId === selectedSessionId;

          return (
            <button
              className={cn(
                "w-full rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-left transition hover:border-aqua/40 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua/40",
                isActive ? "border-aqua/60 bg-aqua/10" : ""
              )}
              key={run.sessionId}
              onClick={() => onSelect(run.sessionId)}
              type="button"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="font-heading text-xl font-semibold text-ice-white">
                    Session: {run.title}
                  </p>
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-400">
                    Updated {formatTimestamp(run.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={getStatusTone(run.status)}>{run.status}</Badge>
                  {run.hasRuntimeMcpActivity ? (
                    <Badge tone="info">Runtime MCP</Badge>
                  ) : (
                    <Badge>Built-in only</Badge>
                  )}
                </div>
              </div>
              <dl className="mt-4 grid gap-4 text-sm leading-7 text-slate-300">
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    User
                  </dt>
                  <dd className="mt-1 text-ice-white">
                    {run.userPrompt || "No saved user prompt for this session yet."}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Assistant
                  </dt>
                  <dd className="mt-1">
                    {run.assistantReply || "Assistant response is still pending."}
                  </dd>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Tools
                  </dt>
                  {run.toolNames.length ? (
                    run.toolNames.map((toolName) => (
                      <Badge key={toolName}>{toolName}</Badge>
                    ))
                  ) : (
                    <span className="text-slate-400">No tool activity recorded.</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
                    Trace
                  </dt>
                  <dd className="font-mono text-xs text-aqua">
                    {run.trace?.runId || "No LangSmith run id saved."}
                  </dd>
                </div>
              </dl>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getStatusTone(status: HistoryRunSummary["status"]) {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "warning";
    default:
      return "info";
  }
}
