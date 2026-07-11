import { handleTelegramUpdate } from "../../../index";
import { logger } from "../../../core/logger";
import {
  assertValidTelegramWebhook,
  resolveWebhookRejectReason,
} from "../../../utils/telegram-webhook-auth";

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
      const reason = await resolveWebhookRejectReason(botId, secretToken);
      logger.warn(
        { botId, reason },
        "Rejected suspicious Telegram webhook request"
      );
      throw error;
    }

    logger.debug(
      `Received webhook for bot ${botId}, update_id: ${body.update_id}`
    );

    await handleTelegramUpdate(botId, body);

    logger.debug(`Webhook processed for bot ${botId}`);

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
