import { NextResponse, type NextRequest } from "next/server";
import { parseUploadDocumentRequest } from "@/lib/validations/documents";
import { withAuthenticatedApiRoute } from "@/server/auth/api";
import { processUploadedDocument } from "@/server/documents/process";
import { uploadDocument } from "@/server/documents/upload";
import { appEventLogger } from "@/server/logging/events";

export async function POST(request: NextRequest) {
  return withAuthenticatedApiRoute(async (auth) => {
    const formData = await request.formData();
    let uploadRequest;

    try {
      uploadRequest = parseUploadDocumentRequest({
        file: formData.get("file")
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "A document file is required."
        },
        { status: 400 }
      );
    }

    appEventLogger.info({
      event: "documents.upload.started",
      metadata: {
        fileName: uploadRequest.metadata.fileName,
        fileSize: uploadRequest.metadata.fileSize,
        fileType: uploadRequest.metadata.mimeType
      },
      userId: auth.userId
    });

    try {
      const result = await uploadDocument({
        file: uploadRequest.file,
        supabase: auth.supabase,
        userId: auth.userId
      });
      const fileContents = Buffer.from(await uploadRequest.file.arrayBuffer());

      void processUploadedDocument({
        documentId: result.documentId,
        fileContents,
        fileName: uploadRequest.metadata.fileName,
        fileType: uploadRequest.metadata.mimeType,
        supabase: auth.supabase,
        userId: auth.userId
      }).catch(() => undefined);

      appEventLogger.info({
        documentId: result.documentId,
        event: "documents.upload.completed",
        metadata: {
          fileName: uploadRequest.metadata.fileName,
          fileSize: uploadRequest.metadata.fileSize,
          fileType: uploadRequest.metadata.mimeType,
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
          fileName: uploadRequest.metadata.fileName,
          fileSize: uploadRequest.metadata.fileSize,
          fileType: uploadRequest.metadata.mimeType
        },
        userId: auth.userId
      });

      return NextResponse.json({ error: message }, { status });
    }
  });
}
