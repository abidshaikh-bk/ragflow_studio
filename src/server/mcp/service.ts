import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  McpServerConfigPayload,
  McpServerConfigUpdatePayload
} from "@/lib/validations/mcp";
import { createRuntimeMcpClient, type RuntimeMcpResolvedConfig } from "@/server/mcp/client";
import { toPublicMcpServerConfig, type McpServerConfigRow } from "@/server/mcp/redaction";
import { decryptSecret, encryptSecret } from "@/server/settings/crypto";

type RuntimeMcpToolSummary = {
  description: string;
  name: string;
};

type ServiceDeps = {
  clientFactory?: typeof createRuntimeMcpClient;
};

const MCP_SERVER_SELECT =
  "id, user_id, name, description, transport, command, args, url, env_encrypted, headers_encrypted, secret_fingerprint, allowed_tools, enabled, is_default, timeout_ms, created_at, updated_at";

type StoredMcpSecretEnvelope = ReturnType<typeof encryptSecret>;

type StoredMcpServerConfigRow = {
  allowed_tools: unknown;
  args: unknown;
  command: string | null;
  created_at: string;
  description: string | null;
  enabled: boolean;
  env_encrypted: Record<string, StoredMcpSecretEnvelope> | null;
  headers_encrypted: Record<string, StoredMcpSecretEnvelope> | null;
  id: string;
  is_default: boolean;
  name: string;
  secret_fingerprint: string | null;
  timeout_ms: number;
  transport: "http" | "stdio";
  updated_at: string;
  url: string | null;
  user_id: string | null;
};

export async function listMcpServerConfigs(
  supabase: SupabaseClient,
  userId: string
) {
  const result = await supabase
    .from("mcp_server_configs")
    .select(MCP_SERVER_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  assertSupabaseSuccess(result.error, "Unable to load MCP server configs.");

  return ((result.data as StoredMcpServerConfigRow[] | null) ?? []).map((row) =>
    toPublicMcpServerConfig(toPublicRow(row))
  );
}

export async function createMcpServerConfig(
  supabase: SupabaseClient,
  userId: string,
  payload: McpServerConfigPayload
) {
  const result = await supabase
    .from("mcp_server_configs")
    .insert(toStoredConfigPayload(userId, payload))
    .select(MCP_SERVER_SELECT)
    .single();

  assertSupabaseSuccess(result.error, "Unable to create the MCP server config.");

  return toPublicMcpServerConfig(toPublicRow(result.data as StoredMcpServerConfigRow));
}

export async function getMcpServerConfig(
  supabase: SupabaseClient,
  userId: string,
  serverId: string
) {
  const row = await getStoredMcpServerConfig(supabase, userId, serverId);

  return row ? toPublicMcpServerConfig(toPublicRow(row)) : null;
}

export async function updateMcpServerConfig(
  supabase: SupabaseClient,
  userId: string,
  serverId: string,
  payload: McpServerConfigUpdatePayload
) {
  const existing = await getStoredMcpServerConfig(supabase, userId, serverId);

  if (!existing) {
    return null;
  }

  const mergedPayload = mergeConfigPayload(existing, payload);
  const result = await supabase
    .from("mcp_server_configs")
    .update(toStoredConfigPayload(userId, mergedPayload))
    .eq("id", serverId)
    .eq("user_id", userId)
    .select(MCP_SERVER_SELECT)
    .single();

  assertSupabaseSuccess(result.error, "Unable to update the MCP server config.");

  return toPublicMcpServerConfig(toPublicRow(result.data as StoredMcpServerConfigRow));
}

export async function deleteMcpServerConfig(
  supabase: SupabaseClient,
  userId: string,
  serverId: string
) {
  const result = await supabase
    .from("mcp_server_configs")
    .delete()
    .eq("id", serverId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  assertSupabaseSuccess(result.error, "Unable to delete the MCP server config.");

  return Boolean(result.data?.id);
}

export async function testMcpServerConfig(
  supabase: SupabaseClient,
  userId: string,
  serverId: string,
  deps?: ServiceDeps
) {
  const config = await getResolvedMcpConfig(supabase, userId, serverId);

  if (!config) {
    return null;
  }

  const client = (deps?.clientFactory ?? createRuntimeMcpClient)(config);
  const tools = await client.listTools();

  return {
    server: toPublicMcpServerConfig(toPublicRow(configToStoredRow(config))),
    tools: tools.map(toToolSummary)
  };
}

export async function listMcpServerTools(
  supabase: SupabaseClient,
  userId: string,
  serverId: string,
  deps?: ServiceDeps
) {
  const config = await getResolvedMcpConfig(supabase, userId, serverId);

  if (!config) {
    return null;
  }

  const client = (deps?.clientFactory ?? createRuntimeMcpClient)(config);
  const tools = await client.listTools();

  return tools.map(toToolSummary);
}

async function getStoredMcpServerConfig(
  supabase: SupabaseClient,
  userId: string,
  serverId: string
) {
  const result = await supabase
    .from("mcp_server_configs")
    .select(MCP_SERVER_SELECT)
    .eq("id", serverId)
    .eq("user_id", userId)
    .maybeSingle();

  assertSupabaseSuccess(result.error, "Unable to load the MCP server config.");

  return (result.data as StoredMcpServerConfigRow | null) ?? null;
}

async function getResolvedMcpConfig(
  supabase: SupabaseClient,
  userId: string,
  serverId: string
) {
  const stored = await getStoredMcpServerConfig(supabase, userId, serverId);

  if (!stored) {
    return null;
  }

  return storedToResolvedConfig(stored);
}

function storedToResolvedConfig(row: StoredMcpServerConfigRow): RuntimeMcpResolvedConfig {
  if (row.transport === "http") {
    return {
      allowedTools: normalizeStringArray(row.allowed_tools),
      description: row.description,
      enabled: row.enabled,
      headers: decryptStoredSecrets(row.headers_encrypted),
      id: row.id,
      name: row.name,
      timeoutMs: row.timeout_ms,
      transport: "http",
      url: row.url ?? "",
      userId: row.user_id
    };
  }

  return {
    allowedTools: normalizeStringArray(row.allowed_tools),
    args: normalizeStringArray(row.args),
    command: row.command ?? "",
    description: row.description,
    enabled: row.enabled,
    env: decryptStoredSecrets(row.env_encrypted),
    id: row.id,
    name: row.name,
    timeoutMs: row.timeout_ms,
    transport: "stdio",
    userId: row.user_id
  };
}

function decryptStoredSecrets(
  value: Record<string, StoredMcpSecretEnvelope> | null
): Record<string, string> {
  if (!value) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      decryptSecret({
        ciphertext: entry.api_key_ciphertext,
        iv: entry.api_key_iv,
        keyVersion: entry.encryption_key_version ?? undefined,
        tag: entry.api_key_tag
      })
    ])
  );
}

function mergeConfigPayload(
  existing: StoredMcpServerConfigRow,
  patch: McpServerConfigUpdatePayload
): McpServerConfigPayload {
  return {
    allowedTools: patch.allowedTools ?? normalizeStringArray(existing.allowed_tools),
    args: patch.args ?? normalizeStringArray(existing.args),
    command: patch.command ?? existing.command ?? undefined,
    description: patch.description ?? existing.description ?? undefined,
    enabled: patch.enabled ?? existing.enabled,
    env: patch.env ?? decryptStoredSecrets(existing.env_encrypted),
    headers: patch.headers ?? decryptStoredSecrets(existing.headers_encrypted),
    isDefault: patch.isDefault ?? existing.is_default,
    name: patch.name ?? existing.name,
    timeoutMs: patch.timeoutMs ?? existing.timeout_ms,
    transport: patch.transport ?? existing.transport,
    url: patch.url ?? existing.url ?? undefined
  };
}

function toStoredConfigPayload(userId: string, payload: McpServerConfigPayload) {
  return {
    allowed_tools: payload.allowedTools,
    args: payload.args,
    command: payload.transport === "stdio" ? payload.command ?? null : null,
    description: payload.description ?? null,
    enabled: payload.enabled,
    env_encrypted:
      payload.transport === "stdio" ? encryptSecretRecord(payload.env) : {},
    headers_encrypted:
      payload.transport === "http" ? encryptSecretRecord(payload.headers) : {},
    is_default: payload.isDefault,
    name: payload.name,
    timeout_ms: payload.timeoutMs,
    transport: payload.transport,
    url: payload.transport === "http" ? payload.url ?? null : null,
    user_id: userId
  };
}

function encryptSecretRecord(value: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(value).map(([key, secret]) => [key, encryptSecret(secret)])
  );
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function toToolSummary(tool: { description?: string; name: string }): RuntimeMcpToolSummary {
  return {
    description: tool.description || "",
    name: tool.name
  };
}

function configToStoredRow(
  config: RuntimeMcpResolvedConfig
): StoredMcpServerConfigRow {
  return {
    allowed_tools: config.allowedTools,
    args: config.transport === "stdio" ? config.args : [],
    command: config.transport === "stdio" ? config.command : null,
    created_at: new Date().toISOString(),
    description: config.description,
    enabled: config.enabled,
    env_encrypted: null,
    headers_encrypted: null,
    id: config.id,
    is_default: false,
    name: config.name,
    secret_fingerprint: null,
    timeout_ms: config.timeoutMs,
    transport: config.transport,
    updated_at: new Date().toISOString(),
    url: config.transport === "http" ? config.url : null,
    user_id: config.userId
  };
}

function toPublicRow(row: StoredMcpServerConfigRow): McpServerConfigRow {
  return {
    allowed_tools: normalizeStringArray(row.allowed_tools),
    args: normalizeStringArray(row.args),
    command: row.command,
    created_at: row.created_at,
    description: row.description,
    enabled: row.enabled,
    env_encrypted:
      row.env_encrypted && Object.keys(row.env_encrypted).length
        ? { configured: "true" }
        : {},
    headers_encrypted:
      row.headers_encrypted && Object.keys(row.headers_encrypted).length
        ? { configured: "true" }
        : {},
    id: row.id,
    is_default: row.is_default,
    name: row.name,
    secret_fingerprint: row.secret_fingerprint,
    timeout_ms: row.timeout_ms,
    transport: row.transport,
    updated_at: row.updated_at,
    url: row.url,
    user_id: row.user_id
  };
}

function assertSupabaseSuccess(error: { message?: string } | null, fallback: string) {
  if (!error) {
    return;
  }

  throw new Error(error.message || fallback);
}
