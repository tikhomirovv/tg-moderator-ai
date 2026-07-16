import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, "tg-moderator-instance-settings", KEY_LENGTH);
}

function resolveEncryptionSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (!secret) {
    throw new Error("SETTINGS_ENCRYPTION_KEY is not configured");
  }
  return secret;
}

/** Encrypt plaintext API key for storage in DB. */
export function encryptSecret(
  plaintext: string,
  env: NodeJS.ProcessEnv = process.env
): string {
  const key = deriveKey(resolveEncryptionSecret(env));
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/** Decrypt stored API key; returns null when ciphertext is empty. */
export function decryptSecret(
  ciphertext: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env
): string | null {
  if (!ciphertext?.trim()) {
    return null;
  }

  const key = deriveKey(resolveEncryptionSecret(env));
  const payload = Buffer.from(ciphertext, "base64");
  const iv = payload.subarray(0, IV_LENGTH);
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = payload.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
