import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const DEFAULT_KEY_VERSION = "v1";
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_IV_LENGTH = 12;

type EncryptedSecret = {
  api_key_ciphertext: string;
  api_key_iv: string;
  api_key_tag: string;
  encryption_key_version: string;
};

type DecryptSecretInput = {
  ciphertext: string;
  iv: string;
  keyVersion?: string;
  tag: string;
};

export function encryptSecret(secret: string): EncryptedSecret {
  const iv = randomBytes(ENCRYPTION_IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);

  return {
    api_key_ciphertext: ciphertext.toString("base64"),
    api_key_iv: iv.toString("base64"),
    api_key_tag: cipher.getAuthTag().toString("base64"),
    encryption_key_version: process.env.APP_ENCRYPTION_KEY_VERSION || DEFAULT_KEY_VERSION
  };
}

export function decryptSecret(input: DecryptSecretInput) {
  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(input.keyVersion),
    Buffer.from(input.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(input.tag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(input.ciphertext, "base64")),
    decipher.final()
  ]);

  return plaintext.toString("utf8");
}

function getEncryptionKey(keyVersion?: string) {
  const seed = process.env.APP_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!seed) {
    throw new Error(
      "Missing required environment variable: APP_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createHash("sha256")
    .update(
      `${keyVersion || process.env.APP_ENCRYPTION_KEY_VERSION || DEFAULT_KEY_VERSION}:${seed}`
    )
    .digest();
}
