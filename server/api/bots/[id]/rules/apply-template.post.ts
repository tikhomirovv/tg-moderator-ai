import { applyTemplateToBot } from "../../../../database/rule-templates";
import { requireBotAccess } from "../../../../utils/bot-access";

export default defineEventHandler(async (event) => {
  const botId = getRouterParam(event, "id");
  if (!botId) {
    throw createError({ statusCode: 400, statusMessage: "Bot ID is required" });
  }

  await requireBotAccess(event, botId);
  await applyTemplateToBot(botId);

  return {
    success: true,
    message: "Rule templates applied to bot",
  };
});
