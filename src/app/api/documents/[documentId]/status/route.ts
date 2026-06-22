import { NextResponse } from "next/server";
import { parseDocumentStatusParams } from "@/lib/validations/documents";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { getDocumentStatus } from "@/server/documents/status";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  return withAuthenticatedApiRoute(async (auth) => {
    try {
      const { documentId } = parseDocumentStatusParams(await context.params);
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
  });
}
