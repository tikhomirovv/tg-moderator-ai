import { logger } from "../../../core/logger";
import { ChatStatisticsRepository } from "../../../database/repositories/chat-statistics-repository";
import { ModerationActionRepository } from "../../../database/repositories/moderation-action-repository";
import { UserContextRepository } from "../../../database/repositories/user-context-repository";
import { UserMessageRepository } from "../../../database/repositories/user-message-repository";

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "id");

    if (!botId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bot ID is required",
      });
    }

    const statsRepo = new ChatStatisticsRepository();
    const actionRepo = new ModerationActionRepository();
    const userContextRepo = new UserContextRepository();
    const messageRepo = new UserMessageRepository();

    // Получаем все сообщения для бота за сегодня
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const todayMessages = await messageRepo.getMessagesByDateRange(
      botId,
      0,
      todayStart,
      todayEnd
    );
    const todayActions = await actionRepo.getActionsByDateRange(
      botId,
      0,
      todayStart,
      todayEnd
    );

    logger.info(
      `Debug: Found ${todayMessages.length} messages and ${todayActions.length} actions for bot ${botId} today`
    );

    // Получаем все действия модерации для бота
    const allActions = await actionRepo.getActionsByBot(botId, 1000);
    const warningActions = allActions.filter(
      (a) => a.action_type === "warning"
    );
    const deleteActions = allActions.filter((a) => a.action_type === "delete");
    const banActions = allActions.filter((a) => a.action_type === "ban");

    // Получаем всех пользователей для бота
    const allUsers = await userContextRepo.getAllUsersByBot(botId);
    const bannedUsers = allUsers.filter((u) => u.is_banned);
    const activeUsers = allUsers.filter(
      (u) =>
        !u.is_banned &&
        u.last_activity >= new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    logger.info(
      `Debug: Found ${allUsers.length} total users, ${bannedUsers.length} banned, ${activeUsers.length} active`
    );

    const statistics = {
      today: {
        messages_processed: todayMessages.length,
        warnings_issued: warningActions.filter((a) => a.timestamp >= todayStart)
          .length,
        messages_deleted: deleteActions.filter((a) => a.timestamp >= todayStart)
          .length,
        users_banned: banActions.filter((a) => a.timestamp >= todayStart)
          .length,
        unique_users: new Set(todayMessages.map((m) => m.user_id)).size,
      },
      week: {
        total_messages_processed:
          allActions.length > 0 ? todayMessages.length : 0, // Пока только сегодня
        total_warnings_issued: warningActions.length,
        total_messages_deleted: deleteActions.length,
        total_users_banned: banActions.length,
        max_unique_users: new Set(allUsers.map((u) => u.user_id)).size,
        days_count: 1, // Пока только сегодня
      },
      users: {
        banned_count: bannedUsers.length,
        active_count: activeUsers.length,
      },
    };

    logger.info(`Debug: Statistics calculated for bot ${botId}`);

    return {
      success: true,
      data: {
        statistics: statistics,
      },
    };
  } catch (error) {
    logger.error({ error: error as Error }, "Error loading statistics");
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading statistics",
    });
  }
});
