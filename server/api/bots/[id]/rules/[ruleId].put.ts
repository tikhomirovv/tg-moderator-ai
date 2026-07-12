import { RuleRepository } from "../../../../database/repositories/rule-repository";
import type { UpdateRuleRequest } from "../../../../database/models/rule";
import { requireBotAccess } from "../../../../utils/bot-access";

export default defineEventHandler(async (event) => {
  const botId = getRouterParam(event, "id");
  const ruleId = getRouterParam(event, "ruleId");

  if (!botId || !ruleId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bot ID and rule ID are required",
    });
  }

  await requireBotAccess(event, botId);
  const body = (await readBody(event)) as UpdateRuleRequest;
  const ruleRepo = new RuleRepository();
  const updated = await ruleRepo.update(ruleId, botId, body);

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: "Rule not found" });
  }

  return {
    success: true,
    data: updated,
    message: "Rule updated successfully",
  };
});
