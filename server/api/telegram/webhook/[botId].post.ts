import { handleTelegramUpdate } from "../../../index";
import { logger } from "../../../core/logger";
import { assertValidTelegramWebhook } from "../../../utils/telegram-webhook-auth";

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

    const secretToken = getHeader(event, "x-telegram-bot-api-secret-token");

    try {
      await assertValidTelegramWebhook(botId, secretToken);
    } catch (error) {
      logger.warn(
        { botId, hasSecretHeader: Boolean(secretToken) },
        "Rejected suspicious Telegram webhook request"
      );
      throw error;
    }

    logger.info(
      `Received webhook for bot ${botId}, update_id: ${body.update_id}`
    );

    await handleTelegramUpdate(botId, body);

    logger.info(`Webhook processed for bot ${botId}`);

    return {
      success: true,
      message: "Webhook processed successfully",
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      (error as { statusCode?: number }).statusCode === 403
    ) {
      throw error;
    }

    logger.error({ error: error as Error }, "Webhook processing failed");

    throw createError({
      statusCode: 500,
      statusMessage: "Error processing webhook",
    });
  }
});
