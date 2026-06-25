import { NextResponse } from "next/server";
import {
  parseDocumentAccessLinkRequest,
  parseDocumentDetailParams
} from "@/lib/validations/documents";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { createDocumentAccessLink } from "@/server/documents/detail";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      documentId?: string;
    }>;
  }
) {
  return withAuthenticatedApiRoute(async (auth) => {
    try {
      const params = parseDocumentDetailParams(await context.params);
      const payload = parseDocumentAccessLinkRequest(await request.json());
      const accessLink = await createDocumentAccessLink(auth.supabase, {
        action: payload.action,
        documentId: params.documentId,
        userId: auth.userId
      });

      if (!accessLink) {
        return NextResponse.json({ error: "Document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: accessLink });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to generate a document access link.";
      const status =
        message === "Invalid document id." || message === "Invalid document access request."
          ? 400
          : 500;

      return NextResponse.json({ error: message }, { status });
    }
  });
}
