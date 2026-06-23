import { NextResponse } from "next/server";
import { isE2EAuthBypassEnabled } from "@/server/auth/e2e";
import { resetE2EChatState } from "@/server/e2e/chat-store";

export async function POST() {
  if (!isE2EAuthBypassEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  resetE2EChatState();

  return NextResponse.json({ data: { ok: true } });
}
