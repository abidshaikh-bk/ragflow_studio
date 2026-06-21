import { NextResponse } from "next/server";
import { getDocumentStatus } from "@/server/documents/status";
import { createServerSupabaseClient } from "@/server/supabase/server";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await authenticateRequest();

  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await context.params;

  try {
    const snapshot = await getDocumentStatus(auth.supabase, {
      documentId,
      userId: auth.userId
    });

    if (!snapshot) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    return NextResponse.json({ data: snapshot });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load the document status.";
    const status = message.includes("Invalid document id") ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

async function authenticateRequest() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return {
    supabase,
    userId: user?.id ?? null
  };
}
