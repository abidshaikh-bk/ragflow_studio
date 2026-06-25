"use client";

import type { HistoryRunDetail } from "./types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Spinner } from "@/components/ui/Spinner";

type RunHistoryDetailProps = {
  error: string;
  isLoading: boolean;
  run: HistoryRunDetail | null;
};

export function RunHistoryDetail({
  error,
  isLoading,
  run
}: RunHistoryDetailProps) {
  if (error) {
    return <ErrorAlert message={error} title="Unable to load session detail" />;
  }

  if (isLoading) {
    return (
      <Card eyebrow="Detail" title="Loading run detail">
        <div className="flex min-h-48 items-center justify-center">
          <Spinner label="Loading history detail" size="md" />
        </div>
      </Card>
    );
  }

  if (!run) {
    return (
      <EmptyState
        description="Select a saved session to inspect the prompt, assistant reply, tool activity, and trace metadata."
        title="Choose a history item"
      />
    );
  }

  return (
    <Card
      description="Review the saved turn transcript, built-in tool calls, runtime MCP activity, and trace metadata for the selected session."
      eyebrow="Detail"
      title={run.title}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge tone={getStatusTone(run.status)}>{run.status}</Badge>
          {run.hasRuntimeMcpActivity ? <Badge tone="info">Runtime MCP used</Badge> : null}
          <Badge>{run.toolActivityCount} tool call{run.toolActivityCount === 1 ? "" : "s"}</Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
              LangSmith trace
            </p>
            <p className="mt-2 font-mono text-sm text-aqua">
              {run.trace?.runId || "No run id saved for this session."}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Trace source: {run.trace?.source || "No linked trace metadata"}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
              Updated
            </p>
            <p className="mt-2 text-sm text-ice-white">{formatTimestamp(run.updatedAt)}</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Session id: <span className="font-mono text-xs">{run.sessionId}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="space-y-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
                Transcript
              </p>
              <h3 className="mt-2 font-heading text-xl font-semibold text-ice-white">
                Saved messages
              </h3>
            </div>
            <div className="space-y-3">
              {run.messages.map((message) => (
                <article
                  className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4"
                  key={message.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={message.role === "assistant" ? "info" : "default"}>
                      {message.role}
                    </Badge>
                    <span className="font-mono text-[11px] text-slate-400">
                      {formatTimestamp(message.createdAt)}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">
                    {message.content}
                  </p>
                  {message.metadata?.citations?.length ? (
                    <p className="mt-3 text-xs text-slate-400">
                      Sources:{" "}
                      {message.metadata.citations
                        .map((citation) =>
                          citation.sourceType === "document" &&
                          citation.chunkIndex != null
                            ? `${citation.fileName} chunk ${citation.chunkIndex + 1}`
                            : citation.fileName
                        )
                        .join(", ")}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
                Tool activity
              </p>
              <h3 className="mt-2 font-heading text-xl font-semibold text-ice-white">
                Execution timeline
              </h3>
            </div>
            {run.toolActivity.length ? (
              <div className="space-y-3">
                {run.toolActivity.map((activity) => (
                  <article
                    className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4"
                    key={activity.id}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={activity.source === "runtime_mcp" ? "info" : "default"}>
                        {activity.toolName}
                      </Badge>
                      <Badge tone={activity.status === "failed" ? "warning" : "success"}>
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-200">
                      {activity.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span>{activity.source === "runtime_mcp" ? "Runtime MCP" : "Built-in tool"}</span>
                      <span>{formatTimestamp(activity.createdAt)}</span>
                      <span>
                        {activity.latencyMs != null
                          ? `${activity.latencyMs} ms`
                          : "Latency unavailable"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-slate-300">
                This session did not record any tool calls yet.
              </p>
            )}
          </section>
        </div>
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

function getStatusTone(status: HistoryRunDetail["status"]) {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "warning";
    default:
      return "info";
  }
}
