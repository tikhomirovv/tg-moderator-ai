import { RuleRepository } from "../../database/repositories/rule-repository";

export default defineEventHandler(async (event) => {
  try {
    const workspaceId = getWorkspaceId(event);
    const ruleRepo = new RuleRepository();
    const rules = await ruleRepo.findAll(workspaceId);

    return {
      success: true,
      data: {
        rules: rules,
      },
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading rules from database",
    });
  }
});
