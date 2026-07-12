import { RuleRepository } from "../../../../database/repositories/rule-repository";
import { requireBotAccess } from "../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);
  const ruleId = getRouterParam(event, "ruleId");

  if (!botId || !ruleId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bot ID and rule ID are required",
    });
  }

  await requireBotAccess(event, botId);
  const ruleRepo = new RuleRepository();
  const deleted = await ruleRepo.delete(ruleId, botId);

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: "Rule not found" });
  }

  return {
    success: true,
    message: "Rule deleted successfully",
  };
});
