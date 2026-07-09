import { randomBytes, timingSafeEqual } from "node:crypto";

export function generateWebhookSecret(): string {
  return randomBytes(32).toString("hex");
}

export function isValidWebhookSecret(
  provided: string | undefined,
  expected: string | null | undefined
): boolean {
  if (!provided || !expected) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
