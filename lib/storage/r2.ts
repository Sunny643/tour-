import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

let client: S3Client | undefined;

function getClient(): S3Client {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are not configured (R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY)");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

export async function presignPutUrl(key: string, contentType: string, expiresInSeconds = 300): Promise<string> {
  if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not configured");
  const command = new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, ContentType: contentType });
  return getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds });
}

export async function presignGetUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not configured");
  const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key });
  return getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds });
}

// If R2_PUBLIC_BASE_URL is set (a public bucket or custom domain), resolve a
// stable public URL instead of a short-lived presigned GET. Shotstack needs a
// URL it can fetch at render time, which favors a public bucket in practice.
export function resolvePublicUrl(key: string): string | null {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${key}`;
}
