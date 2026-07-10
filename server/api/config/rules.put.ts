import { RuleRepository } from "../../database/repositories/rule-repository";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { rules } = body;
    const workspaceId = getWorkspaceId(event);
    const ruleRepo = new RuleRepository();

    for (const rule of rules) {
      const existing = await ruleRepo.findById(rule.id, workspaceId);
      if (existing) {
        await ruleRepo.update(rule.id, workspaceId, {
          name: rule.name,
          description: rule.description,
          ai_prompt: rule.ai_prompt,
          is_active: rule.is_active,
        });
      } else {
        await ruleRepo.create(workspaceId, {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          ai_prompt: rule.ai_prompt,
        });
      }
    }

    return {
      success: true,
      message: "Rules updated successfully",
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error updating rules in database",
    });
  }
});
