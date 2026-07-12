import { RuleRepository } from "../../../../database/repositories/rule-repository";
import { requireBotAccess } from "../../../../utils/bot-access";

export default defineEventHandler(async (event) => {
  const botId = getRouterParam(event, "id");
  if (!botId) {
    throw createError({ statusCode: 400, statusMessage: "Bot ID is required" });
  }

  await requireBotAccess(event, botId);
  const ruleRepo = new RuleRepository();
  const rules = await ruleRepo.findAll(botId);

  return {
    success: true,
    data: { rules },
  };
});
