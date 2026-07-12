import { listRuleTemplates } from "../../../database/rule-templates";
import { requireBotAccess } from "../../../utils/bot-access";
import { requireBotIdParam } from "../../../utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);

  await requireBotAccess(event, botId);

  return {
    success: true,
    data: { templates: listRuleTemplates() },
  };
});
