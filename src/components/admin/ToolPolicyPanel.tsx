"use client";

import { Badge } from "@/components/ui/Badge";

type ToolPolicy = {
  enableDateTime: boolean;
  enableVectorSearch: boolean;
  enableWebSearch: boolean;
};

type ToolPolicyPanelProps = {
  disabled?: boolean;
  onToggle: (key: keyof ToolPolicy, value: boolean) => void;
  value: ToolPolicy;
};

const toolLabels: Array<{
  description: string;
  key: keyof ToolPolicy;
  label: string;
}> = [
  {
    description: "Document-grounded retrieval across the authenticated user’s indexed chunks.",
    key: "enableVectorSearch",
    label: "Vector search"
  },
  {
    description: "Deterministic current date and time context for time-sensitive questions.",
    key: "enableDateTime",
    label: "Date/time"
  },
  {
    description: "Server-side Tavily lookups for current web answers when document context is insufficient.",
    key: "enableWebSearch",
    label: "Web search"
  }
];

export function ToolPolicyPanel({
  disabled = false,
  onToggle,
  value
}: ToolPolicyPanelProps) {
  return (
    <div className="space-y-4">
      {toolLabels.map((tool) => {
        const checked = value[tool.key];

        return (
          <label
            className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-4"
            htmlFor={`tool-policy-${tool.key}`}
            key={tool.key}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-ice-white">{tool.label}</span>
                <Badge tone={checked ? "success" : "warning"}>
                  {checked ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-300">
                {tool.description}
              </p>
            </div>
            <input
              aria-label={tool.label}
              checked={checked}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-black/30 text-aqua focus-visible:ring-aqua"
              disabled={disabled}
              id={`tool-policy-${tool.key}`}
              onChange={(event) => onToggle(tool.key, event.target.checked)}
              type="checkbox"
            />
          </label>
        );
      })}
    </div>
  );
}
