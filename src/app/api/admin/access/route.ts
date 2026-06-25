import { NextResponse } from "next/server";
import { withAdminApiRoute } from "@/server/auth/api";

export async function GET() {
  return withAdminApiRoute(async () =>
    NextResponse.json({
      data: {
        ok: true
      }
    })
  );
}
