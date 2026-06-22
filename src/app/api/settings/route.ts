import { NextResponse, type NextRequest } from "next/server";
import { settingsPayloadSchema } from "@/lib/validations/settings";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { parseJsonBody } from "@/server/http/validation";
import { getUserSettings, saveUserSettings } from "@/server/settings/service";

export async function GET() {
  return withAuthenticatedApiRoute(async (auth) => {
    const settings = await getUserSettings(auth.supabase, auth.userId);

    return NextResponse.json({ data: settings });
  });
}

export async function POST(request: NextRequest) {
  return withAuthenticatedApiRoute(async (auth) => {
    const payload = await parseJsonBody(
      request,
      settingsPayloadSchema,
      "Invalid settings payload."
    );

    if (payload.response) {
      return payload.response;
    }

    try {
      const settings = await saveUserSettings(auth.supabase, auth.userId, payload.data);

      return NextResponse.json({ data: settings });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save your settings right now.";
      const status =
        message.includes("must be re-entered in Settings") ||
        message.includes("Embedding dimension must match")
          ? 400
          : 500;

      return NextResponse.json({ error: message }, { status });
    }
  });
}
