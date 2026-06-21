import { S3Client } from "@aws-sdk/client-s3";
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
