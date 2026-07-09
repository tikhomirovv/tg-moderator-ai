import { BotRepository } from "../database/repositories/bot-repository";
import { isValidWebhookSecret } from "./webhook-auth";

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
