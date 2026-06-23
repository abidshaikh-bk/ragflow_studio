import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMcpServerConfig,
  deleteMcpServerConfig,
  listMcpServerConfigs
} from "@/server/mcp/service";

const maybeSingleMock = vi.fn();
const orderMock = vi.fn();
const selectMock = vi.fn();
const insertMock = vi.fn();
const deleteMock = vi.fn();
const updateMock = vi.fn();
const eqMock = vi.fn();

const supabaseMock = {
  from: vi.fn(() => ({
    delete: deleteMock,
    eq: eqMock,
    insert: insertMock,
    order: orderMock,
    select: selectMock,
    update: updateMock
  }))
};

describe("runtime MCP service", () => {
  beforeEach(() => {
    process.env.APP_ENCRYPTION_KEY = "test-runtime-mcp-key";
    supabaseMock.from.mockClear();
    maybeSingleMock.mockReset();
    orderMock.mockReset();
    selectMock.mockReset();
    insertMock.mockReset();
    deleteMock.mockReset();
    updateMock.mockReset();
    eqMock.mockReset();
  });

  it("returns sanitized config rows without encrypted secrets", async () => {
    orderMock.mockResolvedValue({
      data: [
        {
          allowed_tools: ["remote_lookup"],
          args: [],
          command: null,
          created_at: "2026-06-23T00:00:00.000Z",
          description: "Remote tools",
          enabled: true,
          env_encrypted: null,
          headers_encrypted: {
            Authorization: {
              api_key_ciphertext: "cipher",
              api_key_iv: "iv",
              api_key_tag: "tag",
              encryption_key_version: "v1"
            }
          },
          id: "config-123",
          is_default: false,
          name: "Remote tools",
          secret_fingerprint: "fingerprint",
          timeout_ms: 30000,
          transport: "http",
          updated_at: "2026-06-23T00:00:00.000Z",
          url: "https://example.com/mcp",
          user_id: "user-123"
        }
      ],
      error: null
    });
    selectMock.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: orderMock
      })
    });

    const result = await listMcpServerConfigs(supabaseMock as never, "user-123");

    expect(result).toEqual([
      expect.objectContaining({
        has_header_secrets: true,
        name: "Remote tools"
      })
    ]);
    expect(result[0]).not.toHaveProperty("headers_encrypted");
  });

  it("writes encrypted secret payloads when creating configs", async () => {
    insertMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            allowed_tools: [],
            args: [],
            command: null,
            created_at: "2026-06-23T00:00:00.000Z",
            description: "Remote tools",
            enabled: true,
            env_encrypted: null,
            headers_encrypted: {
              Authorization: {
                api_key_ciphertext: "cipher",
                api_key_iv: "iv",
                api_key_tag: "tag",
                encryption_key_version: "v1"
              }
            },
            id: "config-123",
            is_default: false,
            name: "Remote tools",
            secret_fingerprint: null,
            timeout_ms: 30000,
            transport: "http",
            updated_at: "2026-06-23T00:00:00.000Z",
            url: "https://example.com/mcp",
            user_id: "user-123"
          },
          error: null
        })
      })
    });

    await createMcpServerConfig(supabaseMock as never, "user-123", {
      allowedTools: [],
      args: [],
      description: "Remote tools",
      enabled: true,
      env: {},
      headers: {
        Authorization: "Bearer raw-secret"
      },
      isDefault: false,
      name: "Remote tools",
      timeoutMs: 30000,
      transport: "http",
      url: "https://example.com/mcp"
    });

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        headers_encrypted: expect.objectContaining({
          Authorization: expect.objectContaining({
            api_key_ciphertext: expect.any(String),
            api_key_iv: expect.any(String),
            api_key_tag: expect.any(String)
          })
        }),
        user_id: "user-123"
      })
    );
  });

  it("scopes deletes to the authenticated user", async () => {
    deleteMock.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "config-123"
              },
              error: null
            })
          })
        })
      })
    });

    const deleted = await deleteMcpServerConfig(
      supabaseMock as never,
      "user-123",
      "config-123"
    );

    expect(deleted).toBe(true);
  });
});
