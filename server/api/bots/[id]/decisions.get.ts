import { BotRepository } from "../../../database/repositories/bot-repository";
import { ModerationDecisionRepository } from "../../../database/repositories/moderation-decision-repository";
import { logger } from "../../../core/logger";
import {
  buildDecisionsPagination,
  parseDecisionsQuery,
} from "../../../utils/decisions-query";
import {
  enrichWithRuleName,
  loadRuleNameMap,
} from "../../../core/rule-name-lookup";

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "id");

    if (!botId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bot ID is required",
      });
    }

    const workspaceId = getWorkspaceId(event);
    const botRepo = new BotRepository();
    const bot = await botRepo.findById(botId, workspaceId);

    if (!bot) {
      throw createError({
        statusCode: 404,
        statusMessage: "Bot not found",
      });
    }

    const { page, limit } = parseDecisionsQuery(
      getQuery(event) as Record<string, unknown>
    );
    const decisionRepo = new ModerationDecisionRepository();
    const { items, total } = await decisionRepo.listByBot(botId, { page, limit });
    const ruleNames = await loadRuleNameMap(
      workspaceId,
      items.map((item) => item.rule_violated)
    );
    const enrichedItems = items.map((item) => enrichWithRuleName(item, ruleNames));

    return {
      success: true,
      data: {
        items: enrichedItems,
        pagination: buildDecisionsPagination(page, limit, total),
      },
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    logger.error({ error: error as Error }, "Error loading moderation decisions");
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading moderation decisions",
    });
  }
});
