import { NextResponse, type NextRequest } from "next/server";
import { mcpServerConfigPayloadSchema } from "@/lib/validations/mcp";
import { withAdminApiRoute } from "@/server/auth/api";
import { parseJsonBody } from "@/server/http/validation";
import {
  createGlobalMcpServerConfig,
  listGlobalMcpServerConfigs
} from "@/server/mcp/service";
import { redactSecretsInText } from "@/server/security/redaction";
import { createAdminSupabaseClient } from "@/server/supabase/admin";

export async function GET() {
  return withAdminApiRoute(async () => {
    const supabase = createAdminSupabaseClient();
    const configs = await listGlobalMcpServerConfigs(supabase);

    return NextResponse.json({ data: configs });
  });
}

export async function POST(request: NextRequest) {
  return withAdminApiRoute(async () => {
    const payload = await parseJsonBody(
      request,
      mcpServerConfigPayloadSchema,
      "Invalid MCP server payload."
    );

    if (payload.response) {
      return payload.response;
    }

    try {
      const supabase = createAdminSupabaseClient();
      const config = await createGlobalMcpServerConfig(supabase, payload.data);

      return NextResponse.json({ data: config });
    } catch (error) {
      return NextResponse.json(
        {
          error: redactSecretsInText(
            error instanceof Error
              ? error.message
              : "Unable to create the global MCP server config."
          )
        },
        { status: 500 }
      );
    }
  });
}
