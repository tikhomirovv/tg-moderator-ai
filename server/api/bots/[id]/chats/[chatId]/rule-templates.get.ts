import { listRuleTemplatesForChat } from "../../../../../database/rule-templates";
import { requireBotAccess } from "../../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../../utils/get-bot-id-param";
import { requireBotChat } from "../../../../../utils/require-bot-chat";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);

  await requireBotAccess(event, botId);
  const chat = await requireBotChat(event, botId);
  const templates = await listRuleTemplatesForChat(botId, chat.id);

  return {
    success: true,
    data: { templates },
  };
});
