import { NextResponse } from "next/server";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { listUserDocuments } from "@/server/documents/list";

export async function GET() {
  return withAuthenticatedApiRoute(async (auth) => {
    try {
      const documents = await listUserDocuments(auth.supabase, auth.userId);

      return NextResponse.json({ data: documents });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load the document list.";

      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
