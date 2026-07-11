import { RuleRepository } from "../../../database/repositories/rule-repository";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Rule id is required",
      });
    }

    const workspaceId = getWorkspaceId(event);
    const ruleRepo = new RuleRepository();
    const deleted = await ruleRepo.delete(id, workspaceId);

    if (!deleted) {
      throw createError({
        statusCode: 404,
        statusMessage: "Rule not found",
      });
    }

    return {
      success: true,
      message: "Rule deleted successfully",
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Error deleting rule",
    });
  }
});
