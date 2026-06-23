import { NextResponse, type NextRequest } from "next/server";
import {
  mcpServerConfigUpdatePayloadSchema,
  mcpServerIdSchema
} from "@/lib/validations/mcp";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { parseJsonBody } from "@/server/http/validation";
import { redactSecretsInText } from "@/server/security/redaction";
import {
  deleteMcpServerConfig,
  getMcpServerConfig,
  updateMcpServerConfig
} from "@/server/mcp/service";

type RouteContext = {
  params: Promise<{
    serverId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  return withAuthenticatedApiRoute(async (auth) => {
    const serverId = await parseServerId(context);

    if (!serverId) {
      return NextResponse.json({ error: "Invalid MCP server id." }, { status: 400 });
    }

    const config = await getMcpServerConfig(auth.supabase, auth.userId, serverId);

    if (!config) {
      return NextResponse.json({ error: "MCP server not found." }, { status: 404 });
    }

    return NextResponse.json({ data: config });
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withAuthenticatedApiRoute(async (auth) => {
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
      const config = await updateMcpServerConfig(
        auth.supabase,
        auth.userId,
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
              : "Unable to update the MCP server config."
          )
        },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(_: Request, context: RouteContext) {
  return withAuthenticatedApiRoute(async (auth) => {
    const serverId = await parseServerId(context);

    if (!serverId) {
      return NextResponse.json({ error: "Invalid MCP server id." }, { status: 400 });
    }

    const deleted = await deleteMcpServerConfig(auth.supabase, auth.userId, serverId);

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
