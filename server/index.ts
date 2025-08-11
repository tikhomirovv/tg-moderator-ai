import { TelegramBot } from "./core/bot";
import { BotRepository } from "./database/repositories/bot-repository";
import { RuleRepository } from "./database/repositories/rule-repository";
import { logger } from "./core/logger";

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

    // Создаем экземпляр бота для обработки этого сообщения
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

// Получение списка активных ботов
export async function getActiveBots(): Promise<string[]> {
  try {
    const botRepo = new BotRepository();
    const activeBots = await botRepo.findActive();
    return activeBots.map((bot) => bot.id);
  } catch (error) {
    logger.error({ error: error as Error }, "Error getting active bots");
    return [];
  }
}

// Получение информации о боте
export async function getBotInfo(
  botId: string
): Promise<{ id: string; isRunning: boolean } | null> {
  try {
    const botRepo = new BotRepository();
    const bot = await botRepo.findById(botId);

    if (!bot) {
      return null;
    }

    return {
      id: bot.id,
      isRunning: bot.is_active,
    };
  } catch (error) {
    logger.error(
      { error: error as Error },
      `Error getting bot info for ${botId}`
    );
    return null;
  }
}

// Установка вебхуков для всех ботов
export async function setupWebhooks(baseUrl: string): Promise<void> {
  logger.info("Настройка вебхуков для ботов...");

  try {
    const botRepo = new BotRepository();
    const activeBots = await botRepo.findActive();

    for (const botConfig of activeBots) {
      if (!botConfig.token) {
        logger.warn(`Bot ${botConfig.id} has no token, skipping webhook setup`);
        continue;
      }

      try {
        const bot = new TelegramBot(botConfig.token, botConfig.id, botConfig);
        const webhookUrl = `${baseUrl}/api/telegram/webhook/${botConfig.id}`;
        await bot.setWebhook(webhookUrl);
        logger.info(`Webhook set for bot ${botConfig.id}: ${webhookUrl}`);
      } catch (error) {
        logger.error(
          { error: error as Error },
          `Ошибка установки вебхука для бота ${botConfig.id}`
        );
      }
    }
  } catch (error) {
    logger.error({ error: error as Error }, "Error setting up webhooks");
  }
}
