import type { BotResponse } from "../database/models/bot";
import { BotRepository } from "../database/repositories/bot-repository";
import { logger } from "../core/logger";
import {
  evaluateDeliveryHealth,
  type BotDeliveryHealth,
} from "./bot-delivery-health";
import {
  buildWebhookUrl,
  getWebhookBaseUrl,
  telegramGetWebhookInfo,
} from "./telegram-webhook";
import { requireBotAccess } from "./bot-access";

export async function getBotDeliveryHealth(
  event: Parameters<typeof requireBotAccess>[0],
  botId: string
): Promise<BotDeliveryHealth> {
  await requireBotAccess(event, botId);

  const botRepo = new BotRepository();
  const bot = await botRepo.findById(botId);

  if (!bot) {
    throw createError({
      statusCode: 404,
      statusMessage: "Bot not found",
    });
  }

  const botWithToken = await botRepo.findByIdWithToken(botId);
  const baseUrl = getWebhookBaseUrl();
  const expectedWebhookUrl = baseUrl ? buildWebhookUrl(baseUrl, botId) : null;

  let webhookInfo = null;
  if (bot.is_active && botWithToken?.token) {
    try {
      webhookInfo = await telegramGetWebhookInfo(botWithToken.token);
      if (webhookInfo.last_error_message) {
        const freshError =
          webhookInfo.last_error_date &&
          Date.now() - webhookInfo.last_error_date * 1000 <= 15 * 60 * 1000;
        if (freshError) {
          logger.warn(
            {
              botId,
              lastErrorMessage: webhookInfo.last_error_message,
            },
            "Telegram reported a recent webhook delivery error"
          );
        }
      }
    } catch (error) {
      logger.warn(
        { botId, error: error as Error },
        "Failed to read Telegram webhook info for delivery health"
      );
    }
  }

  return evaluateDeliveryHealth({
    isActive: bot.is_active,
    hasToken: Boolean(botWithToken?.token),
    baseUrl,
    expectedWebhookUrl,
    webhookInfo,
  });
}

export function withDeliveryHealth(
  bot: BotResponse,
  health: BotDeliveryHealth
): BotResponse {
  return {
    ...bot,
    delivery_status: health.status,
    delivery_message: health.message,
  };
}
