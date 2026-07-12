import { RuleRepository } from "../../../../database/repositories/rule-repository";
import { requireBotAccess } from "../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);

  await requireBotAccess(event, botId);
  const ruleRepo = new RuleRepository();
  const rules = await ruleRepo.findAll(botId);

  return {
    success: true,
    data: { rules },
  };
});
