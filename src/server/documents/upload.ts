import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  type S3Client
} from "@aws-sdk/client-s3";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getS3Env } from "@/lib/env";
import { parseUploadDocumentRequest } from "@/lib/validations/documents";
import { createS3Client } from "@/server/s3/client";

type DocumentUploadResult = {
  documentId: string;
  s3Key: string;
  status: "uploaded";
};

type UploadDocumentParams = {
  file: File;
  supabase: SupabaseClient;
  userId: string;
};

type UploadDocumentDeps = {
  bucketName: string;
  s3Client: Pick<S3Client, "send">;
};

type InsertedDocumentRow = {
  id: string;
  status: "uploaded";
};

export async function uploadDocument(
  { file, supabase, userId }: UploadDocumentParams,
  deps?: Partial<UploadDocumentDeps>
): Promise<DocumentUploadResult> {
  const { metadata } = parseUploadDocumentRequest({ file });
  const documentId = randomUUID();
  const s3Key = buildDocumentS3Key(userId, documentId, metadata.extension);
  const { bucketName, s3Client } = resolveUploadDeps(deps);

  await s3Client.send(
    new PutObjectCommand({
      Body: Buffer.from(await file.arrayBuffer()),
      Bucket: bucketName,
      ContentLength: metadata.fileSize,
      ContentType: metadata.mimeType,
      Key: s3Key
    })
  );

  try {
    const insertResult = await supabase
      .from("documents")
      .insert({
        file_name: metadata.fileName,
        file_size: metadata.fileSize,
        file_type: metadata.mimeType,
        id: documentId,
        pinecone_namespace: `user:${userId}`,
        s3_key: s3Key,
        status: "uploaded",
        user_id: userId
      })
      .select("id, status")
      .single();

    if (insertResult.error || !insertResult.data) {
      throw new Error("Unable to create the uploaded document record.");
    }

    const insertedDocument = insertResult.data as InsertedDocumentRow;

    return {
      documentId: insertedDocument.id,
      s3Key,
      status: insertedDocument.status
    };
  } catch (error) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: s3Key
      })
    );

    throw error;
  }
}

function resolveUploadDeps(deps?: Partial<UploadDocumentDeps>): UploadDocumentDeps {
  const s3Env = getS3Env();

  return {
    bucketName: deps?.bucketName ?? s3Env.bucketName,
    s3Client: deps?.s3Client ?? createS3Client()
  };
}

function buildDocumentS3Key(userId: string, documentId: string, extension: string) {
  return `user:${userId}/documents/${documentId}${extension}`;
}
