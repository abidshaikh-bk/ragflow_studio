import { NextResponse } from "next/server";
import { listUserDocuments } from "@/server/documents/list";
import { createServerSupabaseClient } from "@/server/supabase/server";

export async function GET() {
  const auth = await authenticateRequest();

  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const documents = await listUserDocuments(auth.supabase, auth.userId);

    return NextResponse.json({ data: documents });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load the document list.";

    return NextResponse.json({ error: message }, { status: 500 });
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
