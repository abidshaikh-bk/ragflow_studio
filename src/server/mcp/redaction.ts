import { redactSecretsInValue } from "@/server/security/redaction";

export type McpServerConfigRow = {
  allowed_tools: string[];
  args: string[];
  command: string | null;
  created_at: string;
  description: string | null;
  enabled: boolean;
  env_encrypted?: Record<string, string> | null;
  headers_encrypted?: Record<string, string> | null;
  id: string;
  is_default: boolean;
  name: string;
  secret_fingerprint: string | null;
  timeout_ms: number;
  transport: "stdio" | "http";
  updated_at: string;
  url: string | null;
  user_id: string | null;
};

export type PublicMcpServerConfig = Omit<
  McpServerConfigRow,
  "env_encrypted" | "headers_encrypted" | "secret_fingerprint"
> & {
  has_env_secrets: boolean;
  has_header_secrets: boolean;
};

export function toPublicMcpServerConfig(
  row: McpServerConfigRow
): PublicMcpServerConfig {
  return {
    allowed_tools: row.allowed_tools,
    args: row.args,
    command: row.command,
    created_at: row.created_at,
    description: row.description,
    enabled: row.enabled,
    has_env_secrets: hasSecretEntries(row.env_encrypted),
    has_header_secrets: hasSecretEntries(row.headers_encrypted),
    id: row.id,
    is_default: row.is_default,
    name: row.name,
    timeout_ms: row.timeout_ms,
    transport: row.transport,
    updated_at: row.updated_at,
    url: row.url,
    user_id: row.user_id
  };
}

export function redactMcpLogValue(value: unknown) {
  return redactSecretsInValue(value);
}

function hasSecretEntries(value: Record<string, string> | null | undefined) {
  return Boolean(value && Object.keys(value).length > 0);
}
