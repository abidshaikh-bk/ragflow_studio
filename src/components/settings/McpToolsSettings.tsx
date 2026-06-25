"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type McpServerConfig = {
  args: string[];
  command: string | null;
  created_at: string;
  description: string | null;
  enabled: boolean;
  has_env_secrets: boolean;
  has_header_secrets: boolean;
  id: string;
  is_default: boolean;
  name: string;
  timeout_ms: number;
  transport: "http" | "stdio";
  updated_at: string;
  url: string | null;
  user_id: string | null;
};

type McpToolSummary = {
  description: string;
  name: string;
};

type KeyValueRow = {
  id: string;
  key: string;
  value: string;
};

type EditorState = {
  argsText: string;
  command: string;
  description: string;
  enabled: boolean;
  envRows: KeyValueRow[];
  existingHasEnvSecrets: boolean;
  existingHasHeaderSecrets: boolean;
  headerRows: KeyValueRow[];
  id?: string;
  isEditing: boolean;
  name: string;
  timeoutMs: string;
  transport: "http" | "stdio";
  url: string;
};

type FieldErrors = Partial<Record<"command" | "name" | "timeoutMs" | "url", string>>;

const transportOptions = [
  { label: "HTTP", value: "http" },
  { label: "stdio", value: "stdio" }
] as const;

const defaultEditorState: EditorState = {
  argsText: "",
  command: "",
  description: "",
  enabled: false,
  envRows: [],
  existingHasEnvSecrets: false,
  existingHasHeaderSecrets: false,
  headerRows: [],
  isEditing: false,
  name: "",
  timeoutMs: "30000",
  transport: "http",
  url: ""
};

type McpToolsSettingsProps = {
  endpointBase?: string;
  emptyDescription?: string;
  emptyTitle?: string;
  eyebrow?: string;
  loadErrorTitle?: string;
  saveErrorTitle?: string;
  title?: string;
};

export function McpToolsSettings({
  endpointBase = "/api/mcp/servers",
  emptyDescription = "No MCP servers configured. Add an HTTP or stdio runtime MCP server to preview tools without exposing stored secrets.",
  emptyTitle = "No MCP servers configured.",
  eyebrow = "Settings",
  loadErrorTitle = "MCP tools unavailable",
  saveErrorTitle = "Unable to update MCP tools",
  title = "MCP Tools"
}: McpToolsSettingsProps = {}) {
  const [configs, setConfigs] = useState<McpServerConfig[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [editor, setEditor] = useState<EditorState>(defaultEditorState);
  const [toolPreview, setToolPreview] = useState<{
    serverId: string | null;
    tools: McpToolSummary[];
  }>({
    serverId: null,
    tools: []
  });

  useEffect(() => {
    let isMounted = true;

    async function loadConfigs() {
      if (!globalThis.fetch) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(endpointBase, {
          cache: "no-store"
        });
        const payload = (await response.json()) as {
          data?: McpServerConfig[];
          error?: string;
        };

        if (!response.ok || !payload.data) {
          throw new Error(payload.error || "Unable to load MCP tools.");
        }

        if (isMounted) {
          setConfigs(payload.data);
          setLoadError("");
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error ? error.message : "Unable to load MCP tools."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadConfigs();

    return () => {
      isMounted = false;
    };
  }, [endpointBase]);

  const selectedConfig = useMemo(
    () =>
      toolPreview.serverId
        ? configs.find((config) => config.id === toolPreview.serverId) ?? null
        : null,
    [configs, toolPreview.serverId]
  );

  function openCreateDialog() {
    setEditor(defaultEditorState);
    setFieldErrors({});
    setFormError("");
    setSaveMessage("");
    setToolPreview({
      serverId: null,
      tools: []
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(config: McpServerConfig) {
    setEditor({
      argsText: config.args.join(", "),
      command: config.command ?? "",
      description: config.description ?? "",
      enabled: config.enabled,
      envRows: [],
      existingHasEnvSecrets: config.has_env_secrets,
      existingHasHeaderSecrets: config.has_header_secrets,
      headerRows: [],
      id: config.id,
      isEditing: true,
      name: config.name,
      timeoutMs: String(config.timeout_ms),
      transport: config.transport,
      url: config.url ?? ""
    });
    setFieldErrors({});
    setFormError("");
    setSaveMessage("");
    setToolPreview({
      serverId: null,
      tools: []
    });
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
    setFieldErrors({});
    setFormError("");
  }

  function updateEditor<K extends keyof EditorState>(field: K, value: EditorState[K]) {
    setEditor((current) => ({
      ...current,
      [field]: value
    }));
    setFieldErrors((current) => ({
      ...current,
      [field === "timeoutMs" ? "timeoutMs" : field === "url" ? "url" : field === "command" ? "command" : field === "name" ? "name" : "name"]:
        undefined
    }));
    setFormError("");
    setSaveMessage("");
  }

  function updateKeyValueRows(
    field: "envRows" | "headerRows",
    updater: (rows: KeyValueRow[]) => KeyValueRow[]
  ) {
    setEditor((current) => ({
      ...current,
      [field]: updater(current[field])
    }));
    setFormError("");
    setSaveMessage("");
  }

  function validateEditor(state: EditorState) {
    const nextErrors: FieldErrors = {};

    if (!state.name.trim()) {
      nextErrors.name = "Enter a server name.";
    }

    const timeoutMs = Number.parseInt(state.timeoutMs, 10);

    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      nextErrors.timeoutMs = "Enter a timeout in milliseconds.";
    }

    if (state.transport === "http") {
      if (!state.url.trim()) {
        nextErrors.url = "Enter an MCP server URL.";
      }
    } else if (!state.command.trim()) {
      nextErrors.command = "Enter a stdio command.";
    }

    return nextErrors;
  }

  async function saveConfig() {
    const nextErrors = validateEditor(editor);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError("Fix the highlighted MCP tool settings before saving.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    const payload = buildPayload(editor);
    const isEditing = Boolean(editor.id);
    const endpoint = isEditing ? `${endpointBase}/${editor.id}` : endpointBase;

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify(payload),
        headers: {
          "content-type": "application/json"
        },
        method: isEditing ? "PATCH" : "POST"
      });
      const body = (await response.json()) as {
        data?: McpServerConfig;
        error?: string;
      };

      if (!response.ok || !body.data) {
        throw new Error(body.error || "Unable to save the MCP server config.");
      }

      const savedConfig = body.data;

      setConfigs((current) => {
        if (isEditing) {
          return current.map((config) =>
            config.id === savedConfig.id ? savedConfig : config
          );
        }

        return [...current, savedConfig];
      });
      setSaveMessage(
        isEditing
          ? "MCP server updated. Stored secrets remain masked."
          : "MCP server added. Stored secrets remain masked."
      );
      closeDialog();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to save the MCP server config."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function testConnection(serverId: string) {
    setIsTesting(true);
    setFormError("");

    try {
      const response = await fetch(`${endpointBase}/${serverId}/test`, {
        method: "POST"
      });
      const body = (await response.json()) as {
        data?: {
          server: McpServerConfig;
          tools: McpToolSummary[];
        };
        error?: string;
      };

      if (!response.ok || !body.data) {
        throw new Error(body.error || "Unable to test the MCP server config.");
      }

      setToolPreview({
        serverId: body.data.server.id,
        tools: body.data.tools
      });
      setSaveMessage(
        `Connection tested. ${body.data.tools.length} tool${
          body.data.tools.length === 1 ? "" : "s"
        } available.`
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to test the MCP server config."
      );
    } finally {
      setIsTesting(false);
    }
  }

  async function previewTools(serverId: string) {
    setIsTesting(true);
    setFormError("");

    try {
      const response = await fetch(`${endpointBase}/${serverId}/tools`, {
        cache: "no-store"
      });
      const body = (await response.json()) as {
        data?: McpToolSummary[];
        error?: string;
      };

      if (!response.ok || !body.data) {
        throw new Error(body.error || "Unable to load the available tools.");
      }

      setToolPreview({
        serverId,
        tools: body.data
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to load the available tools."
      );
    } finally {
      setIsTesting(false);
    }
  }

  async function deleteConfig(serverId: string) {
    setFormError("");

    try {
      const response = await fetch(`${endpointBase}/${serverId}`, {
        method: "DELETE"
      });
      const body = (await response.json()) as {
        data?: {
          deleted: boolean;
          id: string;
        };
        error?: string;
      };

      if (!response.ok || !body.data?.deleted) {
        throw new Error(body.error || "Unable to delete the MCP server config.");
      }

      setConfigs((current) => current.filter((config) => config.id !== serverId));

      if (toolPreview.serverId === serverId) {
        setToolPreview({
          serverId: null,
          tools: []
        });
      }

      setSaveMessage("MCP server deleted.");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to delete the MCP server config."
      );
    }
  }

  return (
    <div className="space-y-6">
      {loadError ? (
        <ErrorAlert message={loadError} title={loadErrorTitle} />
      ) : null}
      {formError ? (
        <ErrorAlert message={formError} title={saveErrorTitle} />
      ) : null}
      {saveMessage ? (
        <p aria-live="polite" className="text-sm text-emerald" role="status">
          {saveMessage}
        </p>
      ) : null}

      <Card
        action={
          <Button onClick={openCreateDialog} variant="secondary">
            Add MCP Server
          </Button>
        }
        description="Configure runtime MCP servers for later-phase tool use. Secret headers and env values stay masked after save."
        eyebrow={eyebrow}
        title={title}
      >
        {isLoading ? (
          <p className="text-sm text-slate-300">Loading MCP servers...</p>
        ) : configs.length === 0 ? (
          <EmptyState
            action={
              <Button onClick={openCreateDialog} variant="secondary">
                Add MCP Server
              </Button>
            }
            description={emptyDescription}
            title={emptyTitle}
          />
        ) : (
          <div className="space-y-4">
            {configs.map((config) => (
              <section
                className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                key={config.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-xl text-ice-white">{config.name}</h3>
                      <Badge tone="info">{config.transport}</Badge>
                      <Badge tone={config.enabled ? "success" : "warning"}>
                        {config.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="max-w-2xl text-sm leading-7 text-slate-300">
                      {config.description || "No description provided yet."}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                      <span>Timeout: {config.timeout_ms}ms</span>
                      <span>
                        Secrets:{" "}
                        {[
                          config.has_header_secrets ? "headers configured" : null,
                          config.has_env_secrets ? "env configured" : null
                        ]
                          .filter(Boolean)
                          .join(" / ") || "none stored"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => openEditDialog(config)} size="sm" variant="ghost">
                      Edit
                    </Button>
                    <Button
                      loading={isTesting}
                      onClick={() => void testConnection(config.id)}
                      size="sm"
                      variant="secondary"
                    >
                      Test connection
                    </Button>
                    <Button
                      loading={isTesting}
                      onClick={() => void previewTools(config.id)}
                      size="sm"
                      variant="ghost"
                    >
                      Preview tools
                    </Button>
                    <Button
                      onClick={() => void deleteConfig(config.id)}
                      size="sm"
                      variant="ghost"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </Card>

      {selectedConfig ? (
        <Card
          description="Loaded from the MCP tools preview endpoints after a test or preview action."
          eyebrow="Preview"
          title={`Available tools for ${selectedConfig.name}`}
        >
          {toolPreview.tools.length ? (
            <div className="grid gap-3">
              {toolPreview.tools.map((tool) => (
                <div
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  key={tool.name}
                >
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-aqua">
                    {tool.name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {tool.description || "No tool description returned."}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              This server did not return any tools yet.
            </p>
          )}
        </Card>
      ) : null}

      {isDialogOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
          role="dialog"
        >
          <div className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-black-pearl p-6 shadow-glow">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-aqua">
                  MCP Tools
                </p>
                <h2 className="font-heading text-2xl font-semibold text-ice-white">
                  {editor.isEditing ? "Edit MCP server" : "Add MCP server"}
                </h2>
                <p className="text-sm leading-7 text-slate-300">
                  Configure runtime transport details without exposing stored secrets
                  back to the browser.
                </p>
              </div>
              <Button onClick={closeDialog} variant="ghost">
                Close
              </Button>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Input
                error={fieldErrors.name}
                label="Server name"
                onChange={(event) => updateEditor("name", event.target.value)}
                placeholder="Search Tools"
                value={editor.name}
              />
              <Select
                label="Transport"
                onChange={(event) =>
                  updateEditor("transport", event.target.value as "http" | "stdio")
                }
                options={transportOptions.map((option) => ({
                  label: option.label,
                  value: option.value
                }))}
                value={editor.transport}
              />
              <Input
                label="Description"
                onChange={(event) => updateEditor("description", event.target.value)}
                placeholder="Remote search or local utility tools"
                value={editor.description}
              />
              <Input
                error={fieldErrors.timeoutMs}
                hint="Every runtime MCP call must have a timeout."
                label="Timeout (ms)"
                onChange={(event) => updateEditor("timeoutMs", event.target.value)}
                placeholder="30000"
                type="number"
                value={editor.timeoutMs}
              />

              {editor.transport === "http" ? (
                <>
                  <Input
                    error={fieldErrors.url}
                    label="HTTP URL"
                    onChange={(event) => updateEditor("url", event.target.value)}
                    placeholder="https://example.com/mcp"
                    value={editor.url}
                  />
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <KeyValueEditor
                      addLabel="Add header"
                      emptyHint="Add header pairs like Authorization or X-API-Key. Stored header values stay masked after save."
                      label="HTTP headers"
                      rows={editor.headerRows}
                      secretHint={
                        editor.existingHasHeaderSecrets
                          ? "Stored headers are configured and remain masked until you replace them."
                          : null
                      }
                      onAddRow={() =>
                        updateKeyValueRows("headerRows", (rows) => [
                          ...rows,
                          createKeyValueRow()
                        ])
                      }
                      onChange={(rowId, field, value) =>
                        updateKeyValueRows("headerRows", (rows) =>
                          rows.map((row) =>
                            row.id === rowId ? { ...row, [field]: value } : row
                          )
                        )
                      }
                      onRemoveRow={(rowId) =>
                        updateKeyValueRows("headerRows", (rows) =>
                          rows.filter((row) => row.id !== rowId)
                        )
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  <Input
                    error={fieldErrors.command}
                    label="stdio command"
                    onChange={(event) => updateEditor("command", event.target.value)}
                    placeholder="npx"
                    value={editor.command}
                  />
                  <Input
                    hint="Comma-separated args, for example: -y, local-mcp-server"
                    label="stdio args"
                    onChange={(event) => updateEditor("argsText", event.target.value)}
                    placeholder="-y, local-mcp-server"
                    value={editor.argsText}
                  />
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 lg:col-span-2">
                    <KeyValueEditor
                      addLabel="Add env var"
                      emptyHint="Add env vars that the stdio server needs. Stored values stay masked after save."
                      label="stdio env"
                      rows={editor.envRows}
                      secretHint={
                        editor.existingHasEnvSecrets
                          ? "Stored env secrets are configured and remain masked until you replace them."
                          : null
                      }
                      onAddRow={() =>
                        updateKeyValueRows("envRows", (rows) => [
                          ...rows,
                          createKeyValueRow()
                        ])
                      }
                      onChange={(rowId, field, value) =>
                        updateKeyValueRows("envRows", (rows) =>
                          rows.map((row) =>
                            row.id === rowId ? { ...row, [field]: value } : row
                          )
                        )
                      }
                      onRemoveRow={(rowId) =>
                        updateKeyValueRows("envRows", (rows) =>
                          rows.filter((row) => row.id !== rowId)
                        )
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <label className="mt-6 flex items-center gap-3 text-sm text-slate-200">
              <input
                checked={editor.enabled}
                className="size-4 rounded border border-white/20 bg-black/30 accent-aqua"
                onChange={(event) => updateEditor("enabled", event.target.checked)}
                type="checkbox"
              />
              Enabled
            </label>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {editor.id ? (
                <Button
                  loading={isTesting}
                  onClick={() => void testConnection(editor.id!)}
                  variant="ghost"
                >
                  Test connection
                </Button>
              ) : null}
              <Button onClick={closeDialog} variant="ghost">
                Cancel
              </Button>
              <Button loading={isSaving} onClick={() => void saveConfig()} variant="secondary">
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KeyValueEditor({
  addLabel,
  emptyHint,
  label,
  rows,
  secretHint,
  onAddRow,
  onChange,
  onRemoveRow
}: {
  addLabel: string;
  emptyHint: string;
  label: string;
  rows: KeyValueRow[];
  secretHint?: string | null;
  onAddRow: () => void;
  onChange: (rowId: string, field: "key" | "value", value: string) => void;
  onRemoveRow: (rowId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-ice-white">{label}</p>
          <p className="text-xs text-slate-400">{secretHint || emptyHint}</p>
        </div>
        <Button onClick={onAddRow} size="sm" variant="ghost">
          {addLabel}
        </Button>
      </div>
      {rows.length ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" key={row.id}>
              <Input
                label="Key"
                onChange={(event) => onChange(row.id, "key", event.target.value)}
                placeholder="Authorization"
                value={row.key}
              />
              <Input
                label="Value"
                onChange={(event) => onChange(row.id, "value", event.target.value)}
                placeholder="Bearer ..."
                type="password"
                value={row.value}
              />
              <div className="flex items-end">
                <Button onClick={() => onRemoveRow(row.id)} size="sm" variant="ghost">
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function buildPayload(editor: EditorState) {
  const payload: Record<string, unknown> = {
    description: editor.description.trim() || undefined,
    enabled: editor.enabled,
    isDefault: false,
    name: editor.name.trim(),
    timeoutMs: Number.parseInt(editor.timeoutMs, 10),
    transport: editor.transport
  };

  if (editor.transport === "http") {
    payload.url = editor.url.trim();
    const headers = rowsToRecord(editor.headerRows);

    if (Object.keys(headers).length > 0) {
      payload.headers = headers;
    }
  } else {
    payload.command = editor.command.trim();
    payload.args = editor.argsText
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const env = rowsToRecord(editor.envRows);

    if (Object.keys(env).length > 0) {
      payload.env = env;
    }
  }

  return payload;
}

function rowsToRecord(rows: KeyValueRow[]) {
  return Object.fromEntries(
    rows
      .map((row) => [row.key.trim(), row.value] as const)
      .filter(([key, value]) => key && value.trim())
  );
}

function createKeyValueRow(): KeyValueRow {
  return {
    id: `row-${Math.random().toString(36).slice(2, 10)}`,
    key: "",
    value: ""
  };
}
