import { NextResponse, type NextRequest } from "next/server";
import { mcpServerConfigPayloadSchema } from "@/lib/validations/mcp";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { parseJsonBody } from "@/server/http/validation";
import { redactSecretsInText } from "@/server/security/redaction";
import {
  createMcpServerConfig,
  listMcpServerConfigs
} from "@/server/mcp/service";

export async function GET() {
  return withAuthenticatedApiRoute(async (auth) => {
    const configs = await listMcpServerConfigs(auth.supabase, auth.userId);

    return NextResponse.json({ data: configs });
  });
}

export async function POST(request: NextRequest) {
  return withAuthenticatedApiRoute(async (auth) => {
    const payload = await parseJsonBody(
      request,
      mcpServerConfigPayloadSchema,
      "Invalid MCP server payload."
    );

    if (payload.response) {
      return payload.response;
    }

    try {
      const config = await createMcpServerConfig(
        auth.supabase,
        auth.userId,
        payload.data
      );

      return NextResponse.json({ data: config });
    } catch (error) {
      return NextResponse.json(
        {
          error: redactSecretsInText(
            error instanceof Error
              ? error.message
              : "Unable to create the MCP server config."
          )
        },
        { status: 500 }
      );
    }
  });
}
