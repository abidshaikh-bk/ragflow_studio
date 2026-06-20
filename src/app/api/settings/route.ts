import { NextResponse, type NextRequest } from "next/server";
import { settingsPayloadSchema } from "@/lib/validations/settings";
import { getUserSettings, saveUserSettings } from "@/server/settings/service";
import { createServerSupabaseClient } from "@/server/supabase/server";

export async function GET() {
  const auth = await authenticateRequest();

  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getUserSettings(auth.supabase, auth.userId);

  return NextResponse.json({ data: settings });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest();

  if (!auth.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = settingsPayloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      {
        error: "Invalid settings payload.",
        fieldErrors: payload.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const settings = await saveUserSettings(auth.supabase, auth.userId, payload.data);

  return NextResponse.json({ data: settings });
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
