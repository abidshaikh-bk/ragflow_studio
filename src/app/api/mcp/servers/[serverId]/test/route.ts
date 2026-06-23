import { NextResponse } from "next/server";
import { mcpServerIdSchema } from "@/lib/validations/mcp";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { redactSecretsInText } from "@/server/security/redaction";
import { testMcpServerConfig } from "@/server/mcp/service";

type RouteContext = {
  params: Promise<{
    serverId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  return withAuthenticatedApiRoute(async (auth) => {
    const { serverId } = await context.params;
    const parsed = mcpServerIdSchema.safeParse(serverId);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid MCP server id." }, { status: 400 });
    }

    try {
      const result = await testMcpServerConfig(auth.supabase, auth.userId, parsed.data);

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
              : "Unable to test the MCP server config."
          )
        },
        { status: 500 }
      );
    }
  });
}
