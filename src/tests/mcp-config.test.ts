import { describe, expect, it } from "vitest";
import { mcpServerConfigSchema } from "@/lib/validations/mcp";
import { redactMcpLogValue, toPublicMcpServerConfig } from "@/server/mcp/redaction";

describe("runtime MCP config validation", () => {
  it("rejects invalid transports", () => {
    const result = mcpServerConfigSchema.safeParse({
      command: "npx",
      name: "Broken",
      transport: "socket"
    });

    expect(result.success).toBe(false);
  });

  it("requires a command for stdio transport", () => {
    const result = mcpServerConfigSchema.safeParse({
      name: "Stdio server",
      transport: "stdio"
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.command).toContain(
      "Stdio transport requires a command."
    );
  });

  it("strips encrypted secrets from the browser-safe config shape", () => {
    const publicConfig = toPublicMcpServerConfig({
      allowed_tools: ["search_docs"],
      args: ["-y", "server"],
      command: "npx",
      created_at: "2026-06-23T00:00:00.000Z",
      description: "Private runtime server",
      enabled: true,
      env_encrypted: {
        API_KEY: "ciphertext"
      },
      headers_encrypted: {
        Authorization: "ciphertext"
      },
      id: "config-123",
      is_default: false,
      name: "Local tools",
      secret_fingerprint: "fp-123",
      timeout_ms: 30000,
      transport: "stdio",
      updated_at: "2026-06-23T00:00:00.000Z",
      url: null,
      user_id: "user-123"
    });

    expect(publicConfig).toMatchObject({
      has_env_secrets: true,
      has_header_secrets: true,
      name: "Local tools"
    });
    expect(publicConfig).not.toHaveProperty("env_encrypted");
    expect(publicConfig).not.toHaveProperty("headers_encrypted");
    expect(publicConfig).not.toHaveProperty("secret_fingerprint");
  });

  it("redacts MCP log values before persistence", () => {
    expect(
      redactMcpLogValue({
        env_encrypted: {
          OPENAI_API_KEY: "sk-top-secret"
        },
        headers_encrypted: {
          Authorization: "Bearer runtime-secret"
        },
        secret_fingerprint: "fp-123"
      })
    ).toEqual({
      env_encrypted: "[REDACTED]",
      headers_encrypted: "[REDACTED]",
      secret_fingerprint: "[REDACTED]"
    });
  });
});
