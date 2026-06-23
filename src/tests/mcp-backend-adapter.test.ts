import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertAllowedStdioCommand,
  createRuntimeMcpClient,
  type RuntimeMcpResolvedConfig
} from "@/server/mcp/client";
import { loadEnabledMcpConfigs } from "@/server/mcp/registry";
import { loadRuntimeMcpTools } from "@/server/mcp/tools";

const insertMock = vi.fn();
const fromMock = vi.fn((table: string) => {
  if (table === "mcp_tool_invocations") {
    return {
      insert: insertMock
    };
  }

  throw new Error(`Unexpected table: ${table}`);
});

const supabaseMock = {
  from: fromMock
} as never;

const httpConfig: RuntimeMcpResolvedConfig = {
  allowedTools: [],
  description: "Remote runtime MCP",
  enabled: true,
  headers: {
    Authorization: "Bearer runtime-secret"
  },
  id: "http-config",
  name: "remote-tools",
  timeoutMs: 30000,
  transport: "http",
  url: "https://example.com/mcp",
  userId: "user-123"
};

const stdioConfig: RuntimeMcpResolvedConfig = {
  allowedTools: [],
  args: ["-y", "local-mcp-server"],
  command: "npx",
  description: "Local runtime MCP",
  enabled: true,
  env: {
    OPENAI_API_KEY: "runtime-secret"
  },
  id: "stdio-config",
  name: "local-tools",
  timeoutMs: 30000,
  transport: "stdio",
  userId: "user-123"
};

describe("runtime MCP backend adapter", () => {
  beforeEach(() => {
    insertMock.mockReset();
    fromMock.mockClear();
  });

  it("creates an HTTP MCP client", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          result: {
            tools: [
              {
                description: "Look up remote data",
                name: "remote_lookup"
              }
            ]
          }
        }),
        {
          status: 200
        }
      )
    );

    const client = createRuntimeMcpClient(httpConfig, {
      allowBrowserRuntimeForTests: true,
      fetchImpl,
      generateRequestId: () => "req-123"
    });
    const tools = await client.listTools();

    expect(client.transport).toBe("http");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://example.com/mcp",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer runtime-secret",
          "content-type": "application/json"
        }),
        method: "POST"
      })
    );
    expect(tools).toEqual([
      {
        description: "Look up remote data",
        name: "remote_lookup"
      }
    ]);
  });

  it("creates a stdio MCP client only when the command is allowlisted", () => {
    expect(() =>
      createRuntimeMcpClient(stdioConfig, {
        allowBrowserRuntimeForTests: true,
        getAllowedStdioCommands: () => ["npx"]
      })
    ).not.toThrow();

    expect(() => assertAllowedStdioCommand("python", ["npx"])).toThrow(
      /not in the runtime MCP stdio allowlist/i
    );
  });

  it("loads only enabled runtime MCP configs", async () => {
    await expect(
      loadEnabledMcpConfigs(
        {
          supabase: supabaseMock,
          userId: "user-123"
        },
        {
          rows: [
            {
              allowed_tools: [],
              args: [],
              command: "npx",
              description: null,
              enabled: true,
              env_encrypted: {
                TOKEN: "cipher"
              },
              headers_encrypted: {},
              id: "config-a",
              name: "Enabled tools",
              timeout_ms: 30000,
              transport: "stdio",
              url: null,
              user_id: "user-123"
            },
            {
              allowed_tools: [],
              args: [],
              command: "npx",
              description: null,
              enabled: false,
              env_encrypted: {},
              headers_encrypted: {},
              id: "config-b",
              name: "Disabled tools",
              timeout_ms: 30000,
              transport: "stdio",
              url: null,
              user_id: "user-123"
            }
          ]
        }
      )
    ).resolves.toEqual([
      expect.objectContaining({
        id: "config-a",
        name: "Enabled tools"
      })
    ]);
  });

  it("redacts tool input and output logs", async () => {
    insertMock.mockResolvedValue({
      error: null
    });

    const tools = await loadRuntimeMcpTools(
      {
        sessionId: "session-123",
        supabase: supabaseMock,
        userId: "user-123"
      },
      {
        clientFactory: () => ({
          callTool: vi.fn().mockResolvedValue({
            nested: {
              api_key: "sk-output-secret"
            }
          }),
          config: httpConfig,
          listTools: vi.fn().mockResolvedValue([
            {
              description: "Remote lookup",
              name: "remote_lookup"
            }
          ]),
          transport: "http"
        }),
        configLoader: vi.fn().mockResolvedValue([httpConfig]),
        runtimeEnabled: true
      }
    );

    expect(tools).toHaveLength(1);
    await tools[0].invoke({
      authorization: "Bearer input-secret",
      query: "Show me the key sk-input-secret"
    });

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        langsmith_run_id: expect.any(String),
        server_config_id: "http-config",
        status: "success",
        tool_input_redacted: {
          authorization: "[REDACTED]",
          query: "Show me the key [REDACTED]"
        },
        tool_output_preview: {
          nested: {
            api_key: "[REDACTED]"
          }
        },
        tool_name: "remote_lookup"
      })
    );
  });

  it("executes allowlisted stdio requests through the spawned process", async () => {
    const spawnImpl = vi.fn(() => {
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      const stdin = new PassThrough();
      const emitter = new EventEmitter() as EventEmitter & {
        kill: () => void;
        stderr: PassThrough;
        stdin: PassThrough;
        stdout: PassThrough;
      };

      emitter.stdout = stdout;
      emitter.stderr = stderr;
      emitter.stdin = stdin;
      emitter.kill = vi.fn();

      queueMicrotask(() => {
        stdout.write(
          JSON.stringify({
            result: {
              tools: [
                {
                  name: "local_lookup"
                }
              ]
            }
          })
        );
        emitter.emit("close", 0);
      });

      return emitter;
    });

    const client = createRuntimeMcpClient(stdioConfig, {
      allowBrowserRuntimeForTests: true,
      generateRequestId: () => "req-456",
      getAllowedStdioCommands: () => ["npx"],
      spawnImpl
    });

    await expect(client.listTools()).resolves.toEqual([
      {
        name: "local_lookup"
      }
    ]);
    expect(spawnImpl).toHaveBeenCalledWith(
      "npx",
      ["-y", "local-mcp-server"],
      expect.objectContaining({
        stdio: "pipe"
      })
    );
  });
});
