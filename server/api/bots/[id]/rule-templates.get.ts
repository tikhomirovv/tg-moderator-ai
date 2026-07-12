import { listRuleTemplatesForBot } from "../../../database/rule-templates";
import { requireBotAccess } from "../../../utils/bot-access";
import { resolveBotIdFromEvent } from "../../../utils/resolve-bot-id";

export default defineEventHandler(async (event) => {
  const botId = resolveBotIdFromEvent(event, "rule-templates");
  if (!botId) {
    throw createError({ statusCode: 400, statusMessage: "Bot ID is required" });
  }

  await requireBotAccess(event, botId);
  const templates = await listRuleTemplatesForBot(botId);

  return {
    success: true,
    data: { templates },
  };
});
