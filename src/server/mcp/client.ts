import { spawn, type SpawnOptionsWithoutStdio } from "node:child_process";
import { randomUUID } from "node:crypto";
import { getRuntimeMcpEnv } from "@/lib/env";

export type RuntimeMcpToolDefinition = {
  description?: string;
  inputSchema?: unknown;
  name: string;
};

export type RuntimeMcpResolvedConfig =
  | {
      allowedTools: string[];
      description: string | null;
      enabled: boolean;
      headers: Record<string, string>;
      id: string;
      name: string;
      timeoutMs: number;
      transport: "http";
      url: string;
      userId: string | null;
    }
  | {
      allowedTools: string[];
      args: string[];
      command: string;
      description: string | null;
      enabled: boolean;
      env: Record<string, string>;
      id: string;
      name: string;
      timeoutMs: number;
      transport: "stdio";
      userId: string | null;
    };

export type RuntimeMcpClient = {
  callTool: (input: { arguments?: unknown; name: string }) => Promise<unknown>;
  config: RuntimeMcpResolvedConfig;
  listTools: () => Promise<RuntimeMcpToolDefinition[]>;
  transport: RuntimeMcpResolvedConfig["transport"];
};

type SpawnedProcess = {
  emit: (eventName: string, ...args: unknown[]) => boolean;
  kill: () => void;
  on: (eventName: string, listener: (...args: unknown[]) => void) => void;
  stderr: {
    on: (eventName: string, listener: (chunk: Buffer | string) => void) => void;
  };
  stdin: {
    end: (value?: string) => void;
  };
  stdout: {
    on: (eventName: string, listener: (chunk: Buffer | string) => void) => void;
  };
};

type RuntimeMcpClientDeps = {
  allowBrowserRuntimeForTests?: boolean;
  fetchImpl?: typeof fetch;
  generateRequestId?: () => string;
  getAllowedStdioCommands?: () => string[];
  spawnImpl?: (
    command: string,
    args: string[],
    options: SpawnOptionsWithoutStdio
  ) => SpawnedProcess;
};

const DEFAULT_TIMEOUT_MS = 30_000;

export function createRuntimeMcpClient(
  config: RuntimeMcpResolvedConfig,
  deps?: RuntimeMcpClientDeps
): RuntimeMcpClient {
  assertServerOnlyRuntime(deps?.allowBrowserRuntimeForTests);

  if (config.transport === "http") {
    return createHttpMcpClient(config, deps);
  }

  return createStdioMcpClient(config, deps);
}

function createHttpMcpClient(
  config: Extract<RuntimeMcpResolvedConfig, { transport: "http" }>,
  deps?: RuntimeMcpClientDeps
): RuntimeMcpClient {
  const fetchImpl = deps?.fetchImpl ?? fetch;
  const generateRequestId = deps?.generateRequestId ?? randomUUID;

  async function request(method: string, params?: Record<string, unknown>) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      normalizeTimeoutMs(config.timeoutMs)
    );

    try {
      const response = await fetchImpl(config.url, {
        body: JSON.stringify({
          id: generateRequestId(),
          jsonrpc: "2.0",
          method,
          ...(params ? { params } : {})
        }),
        headers: {
          "content-type": "application/json",
          ...config.headers
        },
        method: "POST",
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP MCP request failed with status ${response.status}.`);
      }

      const payload = (await response.json()) as {
        error?: {
          message?: string;
        };
        result?: unknown;
      };

      if (payload.error) {
        throw new Error(payload.error.message || "HTTP MCP request failed.");
      }

      return payload.result;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async callTool(input) {
      return request("tools/call", {
        arguments: input.arguments ?? {},
        name: input.name
      });
    },
    config,
    async listTools() {
      const result = (await request("tools/list")) as {
        tools?: RuntimeMcpToolDefinition[];
      } | null;

      return result?.tools ?? [];
    },
    transport: "http"
  };
}

function createStdioMcpClient(
  config: Extract<RuntimeMcpResolvedConfig, { transport: "stdio" }>,
  deps?: RuntimeMcpClientDeps
): RuntimeMcpClient {
  const allowedCommands =
    deps?.getAllowedStdioCommands?.() ?? getAllowedStdioCommandsFromEnv();

  assertAllowedStdioCommand(config.command, allowedCommands);

  return {
    async callTool(input) {
      return runStdioRequest(
        config,
        {
          method: "tools/call",
          params: {
            arguments: input.arguments ?? {},
            name: input.name
          }
        },
        deps
      );
    },
    config,
    async listTools() {
      const result = (await runStdioRequest(
        config,
        {
          method: "tools/list"
        },
        deps
      )) as {
        tools?: RuntimeMcpToolDefinition[];
      } | null;

      return result?.tools ?? [];
    },
    transport: "stdio"
  };
}

async function runStdioRequest(
  config: Extract<RuntimeMcpResolvedConfig, { transport: "stdio" }>,
  payload: {
    method: string;
    params?: Record<string, unknown>;
  },
  deps?: RuntimeMcpClientDeps
) {
  const spawnImpl = deps?.spawnImpl ?? spawn;
  const generateRequestId = deps?.generateRequestId ?? randomUUID;

  return new Promise<unknown>((resolve, reject) => {
    const processHandle = spawnImpl(config.command, config.args, {
      env: {
        ...process.env,
        ...config.env
      },
      stdio: "pipe"
    });
    const timeout = setTimeout(() => {
      processHandle.kill();
      reject(new Error(`Stdio MCP request timed out after ${config.timeoutMs}ms.`));
    }, normalizeTimeoutMs(config.timeoutMs));

    let stdout = "";
    let stderr = "";

    processHandle.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    processHandle.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    processHandle.on("error", (error) => {
      clearTimeout(timeout);
      reject(error instanceof Error ? error : new Error("Unable to start stdio MCP."));
    });

    processHandle.on("close", (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        reject(
          new Error(
            stderr.trim() || `Stdio MCP process exited with code ${String(code)}.`
          )
        );
        return;
      }

      try {
        const trimmedOutput = stdout.trim();
        const response = trimmedOutput
          ? (JSON.parse(trimmedOutput) as {
              error?: {
                message?: string;
              };
              result?: unknown;
            })
          : {};

        if (response.error) {
          reject(new Error(response.error.message || "Stdio MCP request failed."));
          return;
        }

        resolve(response.result);
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("Unable to parse stdio MCP response.")
        );
      }
    });

    processHandle.stdin.end(
      `${JSON.stringify({
        id: generateRequestId(),
        jsonrpc: "2.0",
        method: payload.method,
        ...(payload.params ? { params: payload.params } : {})
      })}\n`
    );
  });
}

export function assertAllowedStdioCommand(command: string, allowedCommands: string[]) {
  if (!allowedCommands.includes(command)) {
    throw new Error(
      `Stdio MCP command "${command}" is not in the runtime MCP stdio allowlist.`
    );
  }
}

export function getAllowedStdioCommandsFromEnv() {
  return getRuntimeMcpEnv().stdioAllowlist;
}

function assertServerOnlyRuntime(allowBrowserRuntimeForTests = false) {
  if (!allowBrowserRuntimeForTests && typeof window !== "undefined") {
    throw new Error("Runtime MCP clients must only run on the server.");
  }
}

function normalizeTimeoutMs(value: number) {
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
}
