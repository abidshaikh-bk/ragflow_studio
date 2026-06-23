import { tool, type StructuredToolInterface } from "@langchain/core/tools";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  createRuntimeMcpClient,
  type RuntimeMcpClient,
  type RuntimeMcpResolvedConfig,
  type RuntimeMcpToolDefinition
} from "@/server/mcp/client";
import { loadEnabledMcpConfigs } from "@/server/mcp/registry";
import { redactMcpLogValue } from "@/server/mcp/redaction";

type LoadRuntimeMcpToolsParams = {
  sessionId?: string;
  supabase: SupabaseClient;
  userId: string;
};

type ToolDeps = {
  clientFactory?: (config: RuntimeMcpResolvedConfig) => RuntimeMcpClient;
  configLoader?: typeof loadEnabledMcpConfigs;
};

const GENERIC_MCP_INPUT_SCHEMA = z.record(z.string(), z.unknown()).default({});

export async function loadRuntimeMcpTools(
  params: LoadRuntimeMcpToolsParams,
  deps?: ToolDeps
): Promise<StructuredToolInterface[]> {
  const configLoader = deps?.configLoader ?? loadEnabledMcpConfigs;
  const clientFactory = deps?.clientFactory ?? createRuntimeMcpClient;
  const configs = await configLoader({
    includeGlobal: true,
    supabase: params.supabase,
    userId: params.userId
  });

  const tools = await Promise.all(
    configs.map(async (config) => {
      const client = clientFactory(config);
      const definitions = await client.listTools();

      return filterAllowedTools(config, definitions).map((definition) =>
        createLangChainMcpTool({
          client,
          definition,
          sessionId: params.sessionId,
          supabase: params.supabase,
          userId: params.userId
        })
      );
    })
  );

  return tools.flat();
}

function createLangChainMcpTool(input: {
  client: RuntimeMcpClient;
  definition: RuntimeMcpToolDefinition;
  sessionId?: string;
  supabase: SupabaseClient;
  userId: string;
}) {
  const toolName = sanitizeToolName(`${input.client.config.name}_${input.definition.name}`);

  return tool(
    async (args) => {
      const startedAt = Date.now();

      try {
        const result = await input.client.callTool({
          arguments: args,
          name: input.definition.name
        });

        await logMcpInvocation(input.supabase, {
          config: input.client.config,
          latencyMs: Date.now() - startedAt,
          result,
          sessionId: input.sessionId,
          status: "success",
          toolInput: args,
          toolName: input.definition.name,
          userId: input.userId
        });

        return typeof result === "string" ? result : JSON.stringify(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Runtime MCP tool execution failed.";

        await logMcpInvocation(input.supabase, {
          config: input.client.config,
          errorMessage: message,
          latencyMs: Date.now() - startedAt,
          result: {
            error: message
          },
          sessionId: input.sessionId,
          status: "failed",
          toolInput: args,
          toolName: input.definition.name,
          userId: input.userId
        });

        throw new Error(message);
      }
    },
    {
      description:
        input.definition.description ||
        input.client.config.description ||
        `Runtime MCP tool ${input.definition.name}`,
      name: toolName,
      schema: GENERIC_MCP_INPUT_SCHEMA
    }
  );
}

function filterAllowedTools(
  config: RuntimeMcpResolvedConfig,
  definitions: RuntimeMcpToolDefinition[]
) {
  if (!config.allowedTools.length) {
    return definitions;
  }

  return definitions.filter((definition) => config.allowedTools.includes(definition.name));
}

async function logMcpInvocation(
  supabase: SupabaseClient,
  input: {
    config: RuntimeMcpResolvedConfig;
    errorMessage?: string;
    latencyMs: number;
    result: unknown;
    sessionId?: string;
    status: string;
    toolInput: unknown;
    toolName: string;
    userId: string;
  }
) {
  if (!input.sessionId) {
    return;
  }

  const result = await supabase.from("mcp_tool_invocations").insert({
    error_message: input.errorMessage ?? null,
    latency_ms: input.latencyMs,
    server_config_id: input.config.id,
    session_id: input.sessionId,
    status: input.status,
    tool_input_redacted: redactMcpLogValue(input.toolInput),
    tool_name: input.toolName,
    tool_output_preview: createOutputPreview(input.result),
    user_id: input.userId
  });

  if (result.error) {
    throw new Error("Unable to log the runtime MCP tool call.");
  }
}

function createOutputPreview(value: unknown) {
  const redacted = redactMcpLogValue(value);

  if (typeof redacted === "string") {
    return redacted.slice(0, 1000);
  }

  return redacted;
}

function sanitizeToolName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}
