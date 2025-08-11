import { handleTelegramUpdate } from "../../../index";
import { logger } from "../../../core/logger";

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "botId");
    const body = await readBody(event);

    if (!botId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bot ID is required",
      });
    }

    // Обрабатываем обновление от Telegram
    await handleTelegramUpdate(botId, body);

    return {
      success: true,
      message: "Webhook processed successfully",
    };
  } catch (error) {
    logger.error({ error: error as Error }, "Ошибка обработки вебхука");

    throw createError({
      statusCode: 500,
      statusMessage: "Error processing webhook",
    });
  }
});
