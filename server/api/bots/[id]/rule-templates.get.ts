import { listRuleTemplatesForBot } from "../../../database/rule-templates";
import { requireBotAccess } from "../../../utils/bot-access";
import { requireBotIdParam } from "../../../utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);

  await requireBotAccess(event, botId);
  const templates = await listRuleTemplatesForBot(botId);

  return {
    success: true,
    data: { templates },
  };
});
