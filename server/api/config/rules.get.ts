import { RuleRepository } from "../../database/repositories/rule-repository";

export default defineEventHandler(async (event) => {
  try {
    const ruleRepo = new RuleRepository();
    const rules = await ruleRepo.findAll();

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
