import { RuleRepository } from "../../../../database/repositories/rule-repository";
import type { CreateRuleRequest } from "../../../../database/models/rule";
import { requireBotAccess } from "../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);

  await requireBotAccess(event, botId);
  const body = (await readBody(event)) as Omit<CreateRuleRequest, "id">;
  const ruleRepo = new RuleRepository();

  if (!body?.name || !body?.description || !body?.ai_prompt) {
    throw createError({
      statusCode: 400,
      statusMessage: "name, description, and ai_prompt are required",
    });
  }

  const rule = await ruleRepo.create(botId, body);

  return {
    success: true,
    data: rule,
    message: "Rule created successfully",
  };
});
