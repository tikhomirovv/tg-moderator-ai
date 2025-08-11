import { logger } from "../../../core/logger";
import { ModerationActionRepository } from "../../../database/repositories/moderation-action-repository";

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "id");

    if (!botId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bot ID is required",
      });
    }

    const actionRepo = new ModerationActionRepository();

    // Получаем последние действия модерации для всех чатов бота
    const allActions = await actionRepo.getActionsByBot(botId, 50);

    // Преобразуем в формат для фронтенда
    const logs = allActions.map((action) => ({
      id: action._id,
      action:
        action.action_type === "warning"
          ? "Warning Issued"
          : action.action_type === "delete"
          ? "Message Deleted"
          : action.action_type === "ban"
          ? "User Banned"
          : "Moderation Action",
      message:
        action.action_type === "warning"
          ? `Warning for user ${action.user_id} in chat ${action.chat_id}`
          : action.action_type === "delete"
          ? `Message ${action.message_id} deleted in chat ${action.chat_id}`
          : action.action_type === "ban"
          ? `User ${action.user_id} banned in chat ${action.chat_id}`
          : `Action in chat ${action.chat_id}`,
      timestamp: action.timestamp.toISOString(),
      details: {
        rule_violated: action.rule_violated,
        ai_confidence: action.ai_confidence,
        ai_reasoning: action.ai_reasoning,
      },
    }));

    return {
      success: true,
      data: {
        logs: logs,
      },
    };
  } catch (error) {
    logger.error({ error: error as Error }, "Error loading logs");
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading logs",
    });
  }
});
