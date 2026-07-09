import { logger } from "../../../../core/logger";
import { BotRepository } from "../../../../database/repositories/bot-repository";
import { getBotForWorkspace } from "../../../../utils/bots";
import {
  buildWebhookUrl,
  getWebhookBaseUrl,
  telegramSetWebhook,
} from "../../../../utils/telegram-webhook";
import { generateWebhookSecret } from "../../../../utils/webhook-auth";

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "id");
    const workspaceId = getWorkspaceId(event);
    const botConfig = await getBotForWorkspace(botId!, workspaceId);

    if (!botConfig.token) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bot token not found in database",
      });
    }

    const baseUrl = getWebhookBaseUrl();
    if (!baseUrl) {
      throw createError({
        statusCode: 400,
        statusMessage:
          "Webhook URL must use HTTPS BASE_URL. For development, use ngrok or similar service.",
      });
    }

    const botRepo = new BotRepository();
    const webhookSecret =
      botConfig.webhook_secret ?? generateWebhookSecret();
    if (!botConfig.webhook_secret) {
      await botRepo.setWebhookSecret(botId!, webhookSecret);
    }

    const webhookUrl = buildWebhookUrl(baseUrl, botId!);
    await telegramSetWebhook(
      botConfig.token,
      webhookUrl,
      fetch,
      webhookSecret
    );

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
      { error: error as Error, botId: getRouterParam(event, "id") },
      "Error starting webhook"
    );

    throw createError({
      statusCode: 500,
      statusMessage: `Error starting webhook: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    });
  }
});
