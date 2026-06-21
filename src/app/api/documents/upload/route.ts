import { NextResponse, type NextRequest } from "next/server";
import { uploadDocument } from "@/server/documents/upload";
import { createServerSupabaseClient } from "@/server/supabase/server";

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();

  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const maybeFile = formData.get("file");

  if (!(maybeFile instanceof File)) {
    return NextResponse.json(
      { error: "A document file is required." },
      { status: 400 }
    );
  }

  try {
    const result = await uploadDocument({
      file: maybeFile,
      supabase: auth.supabase,
      userId: auth.userId
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to upload your document right now.";
    const status =
      message.includes("Unsupported file type") ||
      message.includes("Choose a document") ||
      message.includes("must not be empty") ||
      message.includes("must be 10MB or smaller")
        ? 400
        : 500;

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
