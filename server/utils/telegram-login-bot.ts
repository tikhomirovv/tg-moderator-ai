export function getTelegramLoginBotToken(): string {
  const token = process.env.TELEGRAM_LOGIN_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("TELEGRAM_LOGIN_BOT_TOKEN is required");
  }
  return token;
}

export function getTelegramLoginBotUsername(): string | null {
  const username = process.env.TELEGRAM_LOGIN_BOT_USERNAME?.trim();
  return username || null;
}

export function getTelegramLoginWebhookSecret(): string | null {
  const secret = process.env.TELEGRAM_LOGIN_WEBHOOK_SECRET?.trim();
  return secret || null;
}

export function assertTelegramLoginWebhookSecret(
  providedSecret: string | undefined
): void {
  const expected = getTelegramLoginWebhookSecret();
  if (!expected) {
    return;
  }

  if (!providedSecret || providedSecret !== expected) {
    throw createError({
      statusCode: 403,
      statusMessage: "Invalid Telegram webhook secret",
    });
  }
}
