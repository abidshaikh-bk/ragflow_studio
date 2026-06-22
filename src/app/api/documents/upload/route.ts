import { NextResponse, type NextRequest } from "next/server";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { processUploadedDocument } from "@/server/documents/process";
import { uploadDocument } from "@/server/documents/upload";
import { appEventLogger } from "@/server/logging/events";

export async function POST(request: NextRequest) {
  return withAuthenticatedApiRoute(async (auth) => {
    const formData = await request.formData();
    const maybeFile = formData.get("file");

    if (!(maybeFile instanceof File)) {
      return NextResponse.json(
        { error: "A document file is required." },
        { status: 400 }
      );
    }

    appEventLogger.info({
      event: "documents.upload.started",
      metadata: {
        fileName: maybeFile.name,
        fileSize: maybeFile.size,
        fileType: maybeFile.type
      },
      userId: auth.userId
    });

    try {
      const result = await uploadDocument({
        file: maybeFile,
        supabase: auth.supabase,
        userId: auth.userId
      });
      const fileContents = Buffer.from(await maybeFile.arrayBuffer());

      void processUploadedDocument({
        documentId: result.documentId,
        fileContents,
        fileName: maybeFile.name,
        fileType: maybeFile.type,
        supabase: auth.supabase,
        userId: auth.userId
      }).catch(() => undefined);

      appEventLogger.info({
        documentId: result.documentId,
        event: "documents.upload.completed",
        metadata: {
          fileName: maybeFile.name,
          fileSize: maybeFile.size,
          fileType: maybeFile.type,
          status: result.status
        },
        userId: auth.userId
      });

      return NextResponse.json(
        {
          data: {
            documentId: result.documentId,
            status: result.status
          }
        },
        { status: 201 }
      );
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

      appEventLogger.error({
        errorMessage: message,
        event: "documents.upload.failed",
        metadata: {
          fileName: maybeFile.name,
          fileSize: maybeFile.size,
          fileType: maybeFile.type
        },
        userId: auth.userId
      });

      return NextResponse.json({ error: message }, { status });
    }
  });
}
