import { BotRepository } from "../database/repositories/bot-repository";
import { isValidWebhookSecret } from "./webhook-auth";

export type WebhookRejectReason =
  | "not_configured"
  | "secret_mismatch"
  | "missing_secret_header"
  | "unknown";

export async function resolveWebhookRejectReason(
  botId: string,
  providedSecret: string | undefined
): Promise<WebhookRejectReason> {
  const botRepo = new BotRepository();
  const expectedSecret = await botRepo.findWebhookSecret(botId);

  if (!expectedSecret) {
    return "not_configured";
  }

  if (!providedSecret) {
    return "missing_secret_header";
  }

  if (!isValidWebhookSecret(providedSecret, expectedSecret)) {
    return "secret_mismatch";
  }

  return "unknown";
}

export async function assertValidTelegramWebhook(
  botId: string,
  providedSecret: string | undefined
): Promise<void> {
  const botRepo = new BotRepository();
  const expectedSecret = await botRepo.findWebhookSecret(botId);

  if (!expectedSecret) {
    throw createError({
      statusCode: 403,
      statusMessage: "Webhook is not configured for this bot",
    });
  }

  if (!isValidWebhookSecret(providedSecret, expectedSecret)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Invalid webhook secret",
    });
  }
}
