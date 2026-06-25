import { NextResponse } from "next/server";
import { parseDocumentDetailParams } from "@/lib/validations/documents";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { getDocumentEmbeddings } from "@/server/documents/detail";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      documentId?: string;
    }>;
  }
) {
  return withAuthenticatedApiRoute(async (auth) => {
    try {
      const params = parseDocumentDetailParams(await context.params);
      const embeddings = await getDocumentEmbeddings(auth.supabase, {
        documentId: params.documentId,
        userId: auth.userId
      });

      if (!embeddings) {
        return NextResponse.json({ error: "Document not found." }, { status: 404 });
      }

      return NextResponse.json({ data: embeddings });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load the embedding detail.";
      const status = message === "Invalid document id." ? 400 : 500;

      return NextResponse.json({ error: message }, { status });
    }
  });
}
