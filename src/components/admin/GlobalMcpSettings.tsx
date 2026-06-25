import { McpToolsSettings } from "@/components/settings/McpToolsSettings";

export function GlobalMcpSettings() {
  return (
    <McpToolsSettings
      emptyDescription="No global MCP servers configured. Add an admin-managed HTTP or stdio runtime MCP server for the shared assistant without exposing stored secrets in the browser."
      emptyTitle="No global MCP servers configured."
      endpointBase="/api/admin/mcp-servers"
      eyebrow="Global MCP"
      loadErrorTitle="Global MCP unavailable"
      saveErrorTitle="Unable to update global MCP"
      title="Shared assistant server registry"
    />
  );
}
