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

    logger.info(
      `Получен webhook для бота ${botId}, update_id: ${body.update_id}`
    );

    // Обрабатываем обновление от Telegram
    await handleTelegramUpdate(botId, body);

    logger.info(`Webhook успешно обработан для бота ${botId}`);

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
