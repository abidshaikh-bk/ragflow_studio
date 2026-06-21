import { extname } from "node:path";
import { z } from "zod";

export const MAX_DOCUMENT_UPLOAD_BYTES = 10 * 1024 * 1024;

const allowedDocumentTypes = {
  ".docx": [
    "",
    "application/octet-stream",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ],
  ".md": ["", "text/markdown", "text/plain", "text/x-markdown"],
  ".pdf": ["", "application/pdf"],
  ".txt": ["", "text/plain"]
} as const;

const uploadDocumentMetadataSchema = z
  .object({
    fileName: z.string().trim().min(1, "Choose a document to upload."),
    fileSize: z
      .number()
      .int()
      .positive("Uploaded files must not be empty.")
      .max(
        MAX_DOCUMENT_UPLOAD_BYTES,
        `Uploaded files must be ${Math.floor(MAX_DOCUMENT_UPLOAD_BYTES / (1024 * 1024))}MB or smaller.`
      ),
    fileType: z.string().trim()
  })
  .superRefine((value, ctx) => {
    const extension = extname(value.fileName).toLowerCase() as keyof typeof allowedDocumentTypes;
    const allowedMimeTypes = allowedDocumentTypes[extension];

    if (!allowedMimeTypes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unsupported file type. Use PDF, TXT, DOCX, or Markdown."
      });
      return;
    }

    if (!(allowedMimeTypes as readonly string[]).includes(value.fileType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unsupported file type. Use PDF, TXT, DOCX, or Markdown."
      });
    }
  });

export type UploadDocumentMetadata = {
  extension: keyof typeof allowedDocumentTypes;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

export function parseUploadDocumentMetadata(input: {
  fileName: string;
  fileSize: number;
  fileType?: string;
}): UploadDocumentMetadata {
  const parsed = uploadDocumentMetadataSchema.safeParse({
    fileName: input.fileName,
    fileSize: input.fileSize,
    fileType: input.fileType?.trim() ?? ""
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid document upload.");
  }

  const extension = extname(parsed.data.fileName).toLowerCase() as keyof typeof allowedDocumentTypes;
  const mimeType = parsed.data.fileType || allowedDocumentTypes[extension][0] || "application/octet-stream";

  return {
    extension,
    fileName: parsed.data.fileName,
    fileSize: parsed.data.fileSize,
    mimeType
  };
}
