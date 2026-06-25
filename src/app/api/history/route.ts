import { NextResponse } from "next/server";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { listHistoryRuns } from "@/server/history/service";

export async function GET() {
  return withAuthenticatedApiRoute(async (auth) => {
    const runs = await listHistoryRuns(auth.supabase, auth.userId);

    return NextResponse.json({ data: runs });
  });
}
