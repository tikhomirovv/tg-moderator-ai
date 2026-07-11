import { RuleRepository } from "../../../database/repositories/rule-repository";
import type { UpdateRuleRequest } from "../../../database/models/rule";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Rule id is required",
      });
    }

    const body = (await readBody(event)) as UpdateRuleRequest;
    const workspaceId = getWorkspaceId(event);
    const ruleRepo = new RuleRepository();

    const updated = await ruleRepo.update(id, workspaceId, body);
    if (!updated) {
      throw createError({
        statusCode: 404,
        statusMessage: "Rule not found",
      });
    }

    return {
      success: true,
      data: updated,
      message: "Rule updated successfully",
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Error updating rule",
    });
  }
});
