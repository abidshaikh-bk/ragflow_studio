import { NextResponse, type NextRequest } from "next/server";
import {
  mcpServerConfigUpdatePayloadSchema,
  mcpServerIdSchema
} from "@/lib/validations/mcp";
import { withAdminApiRoute } from "@/server/auth/api";
import { parseJsonBody } from "@/server/http/validation";
import {
  deleteGlobalMcpServerConfig,
  getGlobalMcpServerConfig,
  updateGlobalMcpServerConfig
} from "@/server/mcp/service";
import { redactSecretsInText } from "@/server/security/redaction";
import { createAdminSupabaseClient } from "@/server/supabase/admin";

type RouteContext = {
  params: Promise<{
    serverId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  return withAdminApiRoute(async () => {
    const serverId = await parseServerId(context);

    if (!serverId) {
      return NextResponse.json({ error: "Invalid MCP server id." }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const config = await getGlobalMcpServerConfig(supabase, serverId);

    if (!config) {
      return NextResponse.json({ error: "MCP server not found." }, { status: 404 });
    }

    return NextResponse.json({ data: config });
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withAdminApiRoute(async () => {
    const serverId = await parseServerId(context);

    if (!serverId) {
      return NextResponse.json({ error: "Invalid MCP server id." }, { status: 400 });
    }

    const payload = await parseJsonBody(
      request,
      mcpServerConfigUpdatePayloadSchema,
      "Invalid MCP server payload."
    );

    if (payload.response) {
      return payload.response;
    }

    try {
      const supabase = createAdminSupabaseClient();
      const config = await updateGlobalMcpServerConfig(
        supabase,
        serverId,
        payload.data
      );

      if (!config) {
        return NextResponse.json({ error: "MCP server not found." }, { status: 404 });
      }

      return NextResponse.json({ data: config });
    } catch (error) {
      return NextResponse.json(
        {
          error: redactSecretsInText(
            error instanceof Error
              ? error.message
              : "Unable to update the global MCP server config."
          )
        },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(_: Request, context: RouteContext) {
  return withAdminApiRoute(async () => {
    const serverId = await parseServerId(context);

    if (!serverId) {
      return NextResponse.json({ error: "Invalid MCP server id." }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const deleted = await deleteGlobalMcpServerConfig(supabase, serverId);

    if (!deleted) {
      return NextResponse.json({ error: "MCP server not found." }, { status: 404 });
    }

    return NextResponse.json({ data: { deleted: true, id: serverId } });
  });
}

async function parseServerId(context: RouteContext) {
  const { serverId } = await context.params;
  const parsed = mcpServerIdSchema.safeParse(serverId);

  return parsed.success ? parsed.data : null;
}
