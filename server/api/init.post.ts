import { BotRepository } from "../database/repositories/bot-repository";
import { RuleRepository } from "../database/repositories/rule-repository";

export default defineEventHandler(async (event) => {
  try {
    const botRepo = new BotRepository();
    const ruleRepo = new RuleRepository();

    const bots = await botRepo.findAll();
    const rules = await ruleRepo.findAll();

    return {
      success: true,
      message: "Database status",
      data: {
        botsCount: bots.length,
        rulesCount: rules.length,
        bots: bots,
        rules: rules,
      },
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error checking database status",
    });
  }
});
