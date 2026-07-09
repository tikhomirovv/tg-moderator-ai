import { logger } from "../../../../core/logger";
import { getBotForWorkspace } from "../../../../utils/bots";

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "id");
    const workspaceId = getWorkspaceId(event);
    const botWithToken = await getBotForWorkspace(botId!, workspaceId);

    if (!botWithToken.token) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bot token not found in database",
      });
    }

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
