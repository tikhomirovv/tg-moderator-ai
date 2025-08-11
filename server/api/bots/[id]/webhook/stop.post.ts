import { bots } from "../../../../index";
import { logger } from "../../../../core/logger";
import { BotRepository } from "../../../../database/repositories/bot-repository";
import { TelegramBot } from "../../../../core/bot";

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "id");
    let bot = bots.get(botId!);

    if (!bot) {
      logger.warn(
        `Bot not found in active bots: ${botId}, attempting to initialize`
      );

      // Пытаемся инициализировать бота из БД
      const botRepo = new BotRepository();
      const botConfig = await botRepo.findByIdWithToken(botId!);

      if (!botConfig) {
        throw createError({
          statusCode: 404,
          statusMessage: "Bot not found in database",
        });
      }

      if (!botConfig.token) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bot token not found in database",
        });
      }

      // Создаем и инициализируем бота
      bot = new TelegramBot(botConfig.token, botConfig.id, botConfig);
      await bot.initialize();
      bots.set(botId!, bot);

      logger.info(`Bot ${botId} initialized and added to active bots`);
    }

    // Получаем токен из БД
    const botRepo = new BotRepository();
    const botWithToken = await botRepo.findByIdWithToken(botId!);

    if (!botWithToken?.token) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bot token not found in database",
      });
    }

    // Удаляем webhook
    const response = await fetch(
      `https://api.telegram.org/bot${botWithToken.token}/deleteWebhook`
    );
    const result = await response.json();

    if (!result.ok) {
      throw new Error(`Failed to delete webhook: ${result.description}`);
    }

    logger.info(`Webhook stopped for bot ${botId}`);

    return {
      success: true,
      data: {
        active: false,
        url: null,
        last_update: new Date(),
      },
      message: "Webhook stopped successfully",
    };
  } catch (error) {
    logger.error({ error: error as Error }, "Error stopping webhook");
    throw createError({
      statusCode: 500,
      statusMessage: "Error stopping webhook",
    });
  }
});
