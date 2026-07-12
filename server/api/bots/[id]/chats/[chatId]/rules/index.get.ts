import { RuleRepository } from "../../../../../../database/repositories/rule-repository";
import { requireBotAccess } from "../../../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../../../utils/get-bot-id-param";
import { requireBotChat } from "../../../../../../utils/require-bot-chat";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);

  await requireBotAccess(event, botId);
  const chat = await requireBotChat(event, botId);
  const ruleRepo = new RuleRepository();
  const rules = await ruleRepo.findAllByChat(botId, chat.id);

  return {
    success: true,
    data: { rules },
  };
});
