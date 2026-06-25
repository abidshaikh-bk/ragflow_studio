import { Card } from "@/components/ui/Card";

export function GlobalMcpSettings() {
  return (
    <Card
      description="Admin-managed global MCP server definitions land in the next task. User BYO MCP settings continue to live under Settings."
      eyebrow="Global MCP"
      title="Server registry arrives next"
    >
      <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-black/20 px-4 py-5 text-sm leading-7 text-slate-300">
        This task keeps the shared assistant focused on global prompt and built-in tool policy.
        Global MCP management will extend this page in `TASK-047` without exposing raw
        headers, env secrets, or private user content in the browser.
      </div>
    </Card>
  );
}
