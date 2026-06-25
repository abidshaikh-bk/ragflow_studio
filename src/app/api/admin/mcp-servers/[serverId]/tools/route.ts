import { NextResponse } from "next/server";
import { mcpServerIdSchema } from "@/lib/validations/mcp";
import { withAdminApiRoute } from "@/server/auth/api";
import { listGlobalMcpServerTools } from "@/server/mcp/service";
import { createAdminSupabaseClient } from "@/server/supabase/admin";

type RouteContext = {
  params: Promise<{
    serverId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  return withAdminApiRoute(async () => {
    const { serverId } = await context.params;
    const parsed = mcpServerIdSchema.safeParse(serverId);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid MCP server id." }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const tools = await listGlobalMcpServerTools(supabase, parsed.data);

    if (!tools) {
      return NextResponse.json({ error: "MCP server not found." }, { status: 404 });
    }

    return NextResponse.json({ data: tools });
  });
}
