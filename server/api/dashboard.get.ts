import { loadDashboardData } from "../core/dashboard-service";
import { BotRepository } from "../database/repositories/bot-repository";
import { ChatStatisticsRepository } from "../database/repositories/chat-statistics-repository";
import { ModerationActionRepository } from "../database/repositories/moderation-action-repository";
import { UserContextRepository } from "../database/repositories/user-context-repository";

export default defineEventHandler(async (event) => {
  try {
    const workspaceId = getWorkspaceId(event);
    const botRepo = new BotRepository();
    const statsRepo = new ChatStatisticsRepository();
    const actionRepo = new ModerationActionRepository();
    const userContextRepo = new UserContextRepository();

    const data = await loadDashboardData(workspaceId, {
      findBots: (id) => botRepo.findAll(id),
      getTodayTotals: (botIds, date) =>
        statsRepo.getWorkspaceTodayTotals(botIds, date),
      getDailyStats: (botIds, startDate, endDate) =>
        statsRepo.getWorkspaceDailyAggregates(botIds, startDate, endDate),
      getActionBreakdown: (botIds, startDate, endDate) =>
        actionRepo.getActionBreakdownByBotIds(botIds, startDate, endDate),
      getRecentActions: (botIds, limit) =>
        actionRepo.getRecentByBotIds(botIds, limit),
      countActiveUsers24h: (botIds) =>
        userContextRepo.countDistinctUsersByBotIds(botIds, {
          activeWithinHours: 24,
        }),
      countBannedUsers: (botIds) =>
        userContextRepo.countDistinctUsersByBotIds(botIds, {
          bannedOnly: true,
        }),
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading dashboard data",
    });
  }
});
