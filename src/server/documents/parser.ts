import { extname } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";

type ParseDocumentParams = {
  documentId: string;
  fileContents: Buffer | Uint8Array | string;
  fileName: string;
  fileType: string;
  supabase: SupabaseClient;
  userId: string;
};

type ParseDocumentResult = {
  text: string;
};

export async function parseDocument({
  documentId,
  fileContents,
  fileName,
  fileType,
  supabase,
  userId
}: ParseDocumentParams): Promise<ParseDocumentResult> {
  await updateDocumentStatus(supabase, {
    documentId,
    errorMessage: null,
    status: "parsing",
    userId
  });

  try {
    const text = extractDocumentText({
      fileContents,
      fileName,
      fileType
    }).trim();

    if (!text) {
      throw new Error("Uploaded documents must contain readable text.");
    }

    return { text };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to parse the uploaded document.";

    await updateDocumentStatus(supabase, {
      documentId,
      errorMessage: message,
      status: "failed",
      userId
    });

    throw new Error(message);
  }
}

export function extractDocumentText(input: {
  fileContents: Buffer | Uint8Array | string;
  fileName: string;
  fileType: string;
}) {
  const extension = extname(input.fileName).toLowerCase();
  const normalizedType = input.fileType.trim().toLowerCase();
  const isTextDocument =
    extension === ".txt" ||
    extension === ".md" ||
    normalizedType === "text/plain" ||
    normalizedType === "text/markdown" ||
    normalizedType === "text/x-markdown";

  if (!isTextDocument) {
    throw new Error("Unsupported document type for parser MVP. Use TXT or Markdown.");
  }

  return toBuffer(input.fileContents).toString("utf8");
}

async function updateDocumentStatus(
  supabase: SupabaseClient,
  input: {
    documentId: string;
    errorMessage: string | null;
    status: "parsing" | "failed";
    userId: string;
  }
) {
  const result = await supabase
    .from("documents")
    .update({
      error_message: input.errorMessage,
      status: input.status
    })
    .eq("id", input.documentId)
    .eq("user_id", input.userId);

  if (result.error) {
    throw new Error(`Unable to update document status to ${input.status}.`);
  }
}

function toBuffer(value: Buffer | Uint8Array | string) {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (typeof value === "string") {
    return Buffer.from(value, "utf8");
  }

  return Buffer.from(value);
}
