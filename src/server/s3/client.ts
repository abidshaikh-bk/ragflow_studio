import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Env } from "@/lib/env";

export function createS3Client() {
  const { accessKeyId, region, secretAccessKey } = getS3Env();

  return new S3Client({
    credentials: {
      accessKeyId,
      secretAccessKey
    },
    region
  });
}

export async function createS3ObjectAccessLink(input: {
  action: "download" | "view";
  expiresInSeconds?: number;
  fileName: string;
  fileType?: string | null;
  key: string;
}) {
  const s3Client = createS3Client();
  const { bucketName } = getS3Env();
  const expiresInSeconds = input.expiresInSeconds ?? 300;
  const safeFileName = input.fileName.replace(/["\r\n]+/g, "-");
  const dispositionType = input.action === "download" ? "attachment" : "inline";

  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: bucketName,
      Key: input.key,
      ResponseContentDisposition: `${dispositionType}; filename="${safeFileName}"`,
      ...(input.fileType ? { ResponseContentType: input.fileType } : {})
    }),
    {
      expiresIn: expiresInSeconds
    }
  );

  return {
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    expiresInSeconds,
    url
  };
}
