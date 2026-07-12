import { RuleRepository } from "../../../../../../database/repositories/rule-repository";
import type { UpdateRuleRequest } from "../../../../../../database/models/rule";
import { requireBotAccess } from "../../../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../../../utils/get-bot-id-param";
import { requireBotChat } from "../../../../../../utils/require-bot-chat";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);
  const ruleId = getRouterParam(event, "ruleId");

  if (!ruleId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ruleId is required",
    });
  }

  await requireBotAccess(event, botId);
  const chat = await requireBotChat(event, botId);
  const body = (await readBody(event)) as UpdateRuleRequest;
  const ruleRepo = new RuleRepository();
  const rule = await ruleRepo.update(ruleId, botId, chat.id, body);

  if (!rule) {
    throw createError({
      statusCode: 404,
      statusMessage: "Rule not found",
    });
  }

  return {
    success: true,
    data: rule,
    message: "Rule updated successfully",
  };
});
