import { RuleRepository } from "../../database/repositories/rule-repository";
import type { CreateRuleRequest } from "../../database/models/rule";

export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody(event)) as Omit<CreateRuleRequest, "id">;
    const workspaceId = getWorkspaceId(event);
    const ruleRepo = new RuleRepository();

    if (!body?.name || !body?.description || !body?.ai_prompt) {
      throw createError({
        statusCode: 400,
        statusMessage: "name, description, and ai_prompt are required",
      });
    }

    const rule = await ruleRepo.create(workspaceId, body);

    return {
      success: true,
      data: rule,
      message: "Rule created successfully",
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Error creating rule",
    });
  }
});
