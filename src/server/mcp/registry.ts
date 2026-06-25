import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptSecret } from "@/server/settings/crypto";
import type { RuntimeMcpResolvedConfig } from "@/server/mcp/client";
import { createAdminSupabaseClient } from "@/server/supabase/admin";

type McpSecretEnvelope =
  | {
      api_key_ciphertext: string;
      api_key_iv: string;
      api_key_tag: string;
      encryption_key_version?: string | null;
    }
  | {
      ciphertext: string;
      iv: string;
      keyVersion?: string | null;
      tag: string;
    };

type McpServerConfigRow = {
  allowed_tools: unknown;
  args: unknown;
  command: string | null;
  description: string | null;
  enabled: boolean;
  env_encrypted: Record<string, McpSecretEnvelope | string> | null;
  headers_encrypted: Record<string, McpSecretEnvelope | string> | null;
  id: string;
  name: string;
  timeout_ms: number;
  transport: "http" | "stdio";
  url: string | null;
  user_id: string | null;
};

type LoadEnabledMcpConfigsParams = {
  includeGlobal?: boolean;
  supabase: SupabaseClient;
  userId: string;
};

type RegistryDeps = {
  rows?: McpServerConfigRow[];
};

const MCP_SERVER_CONFIG_SELECT =
  "id, user_id, name, description, transport, command, args, url, env_encrypted, headers_encrypted, allowed_tools, enabled, timeout_ms";

export async function loadEnabledMcpConfigs(
  params: LoadEnabledMcpConfigsParams,
  deps?: RegistryDeps
) {
  const rows = deps?.rows ?? (await loadRows(params));

  return rows
    .filter((row) => row.enabled)
    .filter((row) => row.user_id === params.userId || (params.includeGlobal && row.user_id === null))
    .map((row) => toResolvedRuntimeMcpConfig(row));
}

async function loadRows(params: LoadEnabledMcpConfigsParams) {
  const supabase = params.includeGlobal ? createAdminSupabaseClient() : params.supabase;
  let query = supabase.from("mcp_server_configs").select(MCP_SERVER_CONFIG_SELECT);

  if (params.includeGlobal) {
    query = query.or(`user_id.eq.${params.userId},user_id.is.null`);
  } else {
    query = query.eq("user_id", params.userId);
  }

  const result = await query.order("created_at", { ascending: true });

  if (result.error) {
    throw new Error(result.error.message || "Unable to load runtime MCP configs.");
  }

  return (result.data as McpServerConfigRow[] | null) ?? [];
}

function toResolvedRuntimeMcpConfig(row: McpServerConfigRow): RuntimeMcpResolvedConfig {
  const allowedTools = normalizeStringArray(row.allowed_tools);
  const timeoutMs = row.timeout_ms;

  if (row.transport === "http") {
    if (!row.url) {
      throw new Error(`HTTP MCP config "${row.name}" is missing a URL.`);
    }

    return {
      allowedTools,
      description: row.description,
      enabled: row.enabled,
      headers: decryptSecretRecord(row.headers_encrypted),
      id: row.id,
      name: row.name,
      timeoutMs,
      transport: "http",
      url: row.url,
      userId: row.user_id
    };
  }

  if (!row.command) {
    throw new Error(`Stdio MCP config "${row.name}" is missing a command.`);
  }

  return {
    allowedTools,
    args: normalizeStringArray(row.args),
    command: row.command,
    description: row.description,
    enabled: row.enabled,
    env: decryptSecretRecord(row.env_encrypted),
    id: row.id,
    name: row.name,
    timeoutMs,
    transport: "stdio",
    userId: row.user_id
  };
}

function decryptSecretRecord(
  value: Record<string, McpSecretEnvelope | string> | null
): Record<string, string> {
  if (!value) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, decryptStoredValue(entry)])
  );
}

function decryptStoredValue(value: McpSecretEnvelope | string) {
  if (typeof value === "string") {
    return value;
  }

  if ("api_key_ciphertext" in value) {
    return decryptSecret({
      ciphertext: value.api_key_ciphertext,
      iv: value.api_key_iv,
      keyVersion: value.encryption_key_version ?? undefined,
      tag: value.api_key_tag
    });
  }

  return decryptSecret({
    ciphertext: value.ciphertext,
    iv: value.iv,
    keyVersion: value.keyVersion ?? undefined,
    tag: value.tag
  });
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}
