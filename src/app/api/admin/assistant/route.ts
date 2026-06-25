import { NextResponse, type NextRequest } from "next/server";
import { assistantRuntimeSettingsPayloadSchema } from "@/lib/validations/admin";
import { withAdminApiRoute } from "@/server/auth/api";
import { getSharedAssistantSettings, saveSharedAssistantSettings } from "@/server/admin/settings";
import { parseJsonBody } from "@/server/http/validation";

export async function GET() {
  return withAdminApiRoute(async (auth) => {
    const settings = await getSharedAssistantSettings(auth.supabase);

    return NextResponse.json({ data: settings });
  });
}

export async function PUT(request: NextRequest) {
  return withAdminApiRoute(async (auth) => {
    const payload = await parseJsonBody(
      request,
      assistantRuntimeSettingsPayloadSchema,
      "Invalid assistant settings payload."
    );

    if (payload.response) {
      return payload.response;
    }

    const settings = await saveSharedAssistantSettings(
      auth.supabase,
      auth.userId,
      payload.data
    );

    return NextResponse.json({ data: settings });
  });
}
