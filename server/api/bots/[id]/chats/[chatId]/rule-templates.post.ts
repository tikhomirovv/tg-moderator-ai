import { applyRuleTemplateToChat } from "../../../../../database/rule-templates";
import { requireBotAccess } from "../../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../../utils/get-bot-id-param";
import { requireBotChat } from "../../../../../utils/require-bot-chat";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);

  const body = (await readBody(event)) as { template_id?: string };
  const templateId = body?.template_id?.trim();
  if (!templateId) {
    throw createError({
      statusCode: 400,
      statusMessage: "template_id is required",
    });
  }

  await requireBotAccess(event, botId);
  const chat = await requireBotChat(event, botId);
  const result = await applyRuleTemplateToChat(botId, chat.id, templateId);

  if (result.added === false && result.reason === "not_found") {
    throw createError({
      statusCode: 404,
      statusMessage: "Rule template not found",
    });
  }

  if (result.added === false && result.reason === "already_exists") {
    throw createError({
      statusCode: 409,
      statusMessage: "This rule template is already on the chat",
    });
  }

  return {
    success: true,
    message: "Rule template added",
    data: { rule: result.rule },
  };
});
