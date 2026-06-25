"use client";

import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type HistoryFiltersProps = {
  runCount: number;
  runtimeMcpCount: number;
  searchValue: string;
  selectedStatus: string;
  selectedToolSource: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onToolSourceChange: (value: string) => void;
};

export function HistoryFilters({
  onSearchChange,
  onStatusChange,
  onToolSourceChange,
  runCount,
  runtimeMcpCount,
  searchValue,
  selectedStatus,
  selectedToolSource
}: HistoryFiltersProps) {
  return (
    <Card
      description="Narrow your audit trail by run status, tool source, or a specific session title / LangSmith run id."
      eyebrow="Filters"
      title="Review controls"
    >
      <div className="space-y-5">
        <div className="grid gap-3 rounded-3xl border border-white/10 bg-black/20 p-4 sm:grid-cols-2 lg:grid-cols-1">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-400">
              Sessions loaded
            </p>
            <p className="mt-2 text-2xl font-semibold text-ice-white">{runCount}</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-400">
              Runtime MCP runs
            </p>
            <p className="mt-2 text-2xl font-semibold text-ice-white">
              {runtimeMcpCount}
            </p>
          </div>
        </div>
        <Input
          label="Search history"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by session title, prompt, or trace id"
          value={searchValue}
        />
        <Select
          label="Run status"
          onChange={(event) => onStatusChange(event.target.value)}
          options={[
            { label: "All statuses", value: "all" },
            { label: "Completed", value: "completed" },
            { label: "Failed", value: "failed" },
            { label: "In progress", value: "in_progress" }
          ]}
          value={selectedStatus}
        />
        <Select
          label="Tool source"
          onChange={(event) => onToolSourceChange(event.target.value)}
          options={[
            { label: "All tool activity", value: "all" },
            { label: "Built-in tools", value: "built_in" },
            { label: "Runtime MCP tools", value: "runtime_mcp" }
          ]}
          value={selectedToolSource}
        />
      </div>
    </Card>
  );
}
