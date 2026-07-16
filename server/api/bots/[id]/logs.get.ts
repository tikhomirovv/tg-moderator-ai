import { logger } from "../../../core/logger";
import { loadRuleNameMap, resolveRuleName } from "../../../core/rule-name-lookup";
import { BotRepository } from "../../../database/repositories/bot-repository";
import { ModerationActionRepository } from "../../../database/repositories/moderation-action-repository";
import { requireBotAccess } from "../../../utils/bot-access";
import { requireBotIdParam } from "../../../utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  try {
    const botId = requireBotIdParam(event);

    await requireBotAccess(event, botId);
    const botRepo = new BotRepository();
    const bot = await botRepo.findById(botId);

    if (!bot) {
      throw createError({
        statusCode: 404,
        statusMessage: "Bot not found",
      });
    }

    const actionRepo = new ModerationActionRepository();
    const allActions = await actionRepo.getActionsByBot(botId, 50);
    const ruleNames = await loadRuleNameMap(
      allActions.map((action) => ({ botId, ruleId: action.rule_violated }))
    );

    const logs = allActions.map((action) => ({
      id: action._id,
      action_type: action.action_type,
      message:
        action.action_type === "warning"
          ? `Warning for user ${action.user_id} in chat ${action.chat_id}`
          : action.action_type === "delete"
          ? `Message ${action.message_id} deleted in chat ${action.chat_id}`
          : action.action_type === "ban"
          ? `User ${action.user_id} banned in chat ${action.chat_id}`
          : action.action_type === "reset_warnings"
          ? `Warnings reset for user ${action.user_id} in chat ${action.chat_id}`
          : action.action_type === "unban"
          ? `User ${action.user_id} unbanned in chat ${action.chat_id}`
          : action.action_type === "pardon"
          ? `User ${action.user_id} pardoned in chat ${action.chat_id}`
          : `Action in chat ${action.chat_id}`,
      timestamp: action.timestamp.toISOString(),
      details: {
        rule_violated: action.rule_violated,
        rule_name: resolveRuleName(action.rule_violated, ruleNames),
        ai_confidence: action.ai_confidence,
        ai_reasoning: action.ai_reasoning,
      },
    }));

    return {
      success: true,
      data: {
        logs,
      },
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    logger.error({ error: error as Error }, "Error loading logs");
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading logs",
    });
  }
});
