import { NextResponse } from "next/server";
import { mcpServerIdSchema } from "@/lib/validations/mcp";
import { withAdminApiRoute } from "@/server/auth/api";
import { testGlobalMcpServerConfig } from "@/server/mcp/service";
import { redactSecretsInText } from "@/server/security/redaction";
import { createAdminSupabaseClient } from "@/server/supabase/admin";

type RouteContext = {
  params: Promise<{
    serverId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  return withAdminApiRoute(async () => {
    const { serverId } = await context.params;
    const parsed = mcpServerIdSchema.safeParse(serverId);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid MCP server id." }, { status: 400 });
    }

    try {
      const supabase = createAdminSupabaseClient();
      const result = await testGlobalMcpServerConfig(supabase, parsed.data);

      if (!result) {
        return NextResponse.json({ error: "MCP server not found." }, { status: 404 });
      }

      return NextResponse.json({ data: result });
    } catch (error) {
      return NextResponse.json(
        {
          error: redactSecretsInText(
            error instanceof Error
              ? error.message
              : "Unable to test the global MCP server config."
          )
        },
        { status: 500 }
      );
    }
  });
}
