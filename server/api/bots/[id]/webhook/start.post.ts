import { logger } from "../../../../core/logger";
import { getBotForWorkspace } from "../../../../utils/bots";
import { TelegramBot } from "../../../../core/bot";

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "id");
    logger.info(`Attempting to start webhook for bot: ${botId}`);

    // Получаем бота из БД
    const workspaceId = getWorkspaceId(event);
    const botConfig = await getBotForWorkspace(botId!, workspaceId);

    if (!botConfig.token) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bot token not found in database",
      });
    }

    logger.info(`Bot found: ${botId}, proceeding with webhook setup`);

    // Получаем базовый URL из переменной окружения
    // BASE_URL должен быть доступен из интернета для получения webhook от Telegram
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    // Проверяем, что URL использует HTTPS (требование Telegram)
    if (!baseUrl.startsWith("https://")) {
      throw createError({
        statusCode: 400,
        statusMessage: `Webhook URL must use HTTPS. Current URL: ${baseUrl}. For development, use ngrok or similar service.`,
      });
    }

    const webhookUrl = `${baseUrl}/api/telegram/webhook/${botId}`;

    logger.info(`Setting up webhook URL: ${webhookUrl}`);

    // Создаем экземпляр бота и устанавливаем webhook
    const bot = new TelegramBot(botConfig.token, botConfig.id, botConfig);
    await bot.setWebhook(webhookUrl);

    logger.info(`Webhook started for bot ${botId}: ${webhookUrl}`);

    return {
      success: true,
      data: {
        active: true,
        url: webhookUrl,
        last_update: new Date(),
      },
      message: "Webhook started successfully",
    };
  } catch (error) {
    logger.error(
      {
        error: error as Error,
        botId: getRouterParam(event, "id"),
        baseUrl: process.env.BASE_URL || "http://localhost:3000",
      },
      "Error starting webhook"
    );

    // Возвращаем более детальную ошибку
    throw createError({
      statusCode: 500,
      statusMessage: `Error starting webhook: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    });
  }
});
