import { loadDashboardData } from "../core/dashboard-service";
import { loadRuleNameMap, resolveRuleName } from "../core/rule-name-lookup";
import { BotRepository } from "../database/repositories/bot-repository";
import { ChatStatisticsRepository } from "../database/repositories/chat-statistics-repository";
import { ModerationActionRepository } from "../database/repositories/moderation-action-repository";
import { UserContextRepository } from "../database/repositories/user-context-repository";
import { requireSession } from "../utils/session";

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireSession(event);
    const botRepo = new BotRepository();
    const statsRepo = new ChatStatisticsRepository();
    const actionRepo = new ModerationActionRepository();
    const userContextRepo = new UserContextRepository();

    const data = await loadDashboardData(user.id, {
      findBots: (userId) => botRepo.findAllForUser(userId),
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

    const ruleNames = await loadRuleNameMap(
      data.recent_activity.map((item) => ({
        botId: item.bot_id,
        ruleId: item.rule_violated,
      }))
    );
    data.recent_activity = data.recent_activity.map((item) => ({
      ...item,
      rule_name: resolveRuleName(item.rule_violated, ruleNames),
    }));

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
