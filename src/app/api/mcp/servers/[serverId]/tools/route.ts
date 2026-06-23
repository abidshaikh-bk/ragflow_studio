import { NextResponse } from "next/server";
import { mcpServerIdSchema } from "@/lib/validations/mcp";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { listMcpServerTools } from "@/server/mcp/service";

type RouteContext = {
  params: Promise<{
    serverId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  return withAuthenticatedApiRoute(async (auth) => {
    const { serverId } = await context.params;
    const parsed = mcpServerIdSchema.safeParse(serverId);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid MCP server id." }, { status: 400 });
    }

    const tools = await listMcpServerTools(auth.supabase, auth.userId, parsed.data);

    if (!tools) {
      return NextResponse.json({ error: "MCP server not found." }, { status: 404 });
    }

    return NextResponse.json({ data: tools });
  });
}
