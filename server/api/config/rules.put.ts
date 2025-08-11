import { RuleRepository } from "../../database/repositories/rule-repository";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { rules } = body;

    const ruleRepo = new RuleRepository();

    // Обновляем каждое правило
    for (const rule of rules) {
      if (rule._id) {
        // Обновляем существующее правило
        await ruleRepo.update(rule.id, {
          name: rule.name,
          description: rule.description,
          ai_prompt: rule.ai_prompt,
          severity: rule.severity,
          is_active: rule.is_active,
        });
      } else {
        // Создаем новое правило
        await ruleRepo.create({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          ai_prompt: rule.ai_prompt,
          severity: rule.severity,
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
