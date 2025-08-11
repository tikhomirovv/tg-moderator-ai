import { logger } from "../../../../core/logger";
import { BotRepository } from "../../../../database/repositories/bot-repository";

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "id");

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
