import { TelegramBot } from "./core/bot";
import { BotRepository } from "./database/repositories/bot-repository";
import type { Bot } from "./database/models/bot";
import { logger } from "./core/logger";
import { reconcileBotWebhook } from "./utils/bot-lifecycle";
import { getWebhookBaseUrl } from "./utils/telegram-webhook";
import { isChatActivationUpdate } from "./core/chat-activation";

export function isBotEligibleForUpdates(
  bot: Pick<Bot, "is_active" | "token"> | null | undefined
): bot is Pick<Bot, "is_active" | "token"> & { token: string; is_active: true } {
  return Boolean(bot?.token && bot.is_active);
}

// Обработка обновления от Telegram
export async function handleTelegramUpdate(
  botId: string,
  update: any
): Promise<void> {
  try {
    // Получаем бота из БД и создаем экземпляр для обработки
    const botRepo = new BotRepository();
    const botConfig = await botRepo.findByIdWithToken(botId);

    if (!botConfig) {
      logger.warn(`Bot ${botId} not found in database`);
      return;
    }

    if (!botConfig.token) {
      logger.warn(`Bot ${botId} has no token`);
      return;
    }

    if (!botConfig.is_active && !isChatActivationUpdate(update)) {
      logger.debug(`Bot ${botId} is inactive, ignoring update`);
      return;
    }

    if (!botConfig.is_active) {
      logger.debug(
        `Processing chat activation update for inactive bot ${botId}`
      );
    }

    const bot = new TelegramBot(botConfig.token, botConfig.id, botConfig);

    // Обрабатываем обновление
    await bot.handleUpdate(update);
  } catch (error) {
    logger.error(
      { error: error as Error },
      `Error handling update for bot ${botId}`
    );
  }
}

// Reconcile webhooks for all active bots on startup
export async function setupWebhooks(baseUrl?: string): Promise<void> {
  const resolvedBaseUrl = baseUrl ?? getWebhookBaseUrl();
  if (!resolvedBaseUrl) {
    logger.warn("Skipping webhook setup: HTTPS BASE_URL is not configured");
    return;
  }

  logger.info("Reconciling webhooks for active bots...");

  try {
    const botRepo = new BotRepository();
    const activeBots = await botRepo.findActive();

    for (const botConfig of activeBots) {
      if (!botConfig.token) {
        logger.warn(`Bot ${botConfig.id} has no token, skipping webhook setup`);
        continue;
      }

      await reconcileBotWebhook(botConfig.id, botConfig);
    }
  } catch (error) {
    logger.error({ error: error as Error }, "Error setting up webhooks");
  }
}
