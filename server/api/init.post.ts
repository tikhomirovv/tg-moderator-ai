import { BotRepository } from "../database/repositories/bot-repository";
import { RuleRepository } from "../database/repositories/rule-repository";
import { requireSession } from "../utils/session";

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireSession(event);
    const botRepo = new BotRepository();
    const ruleRepo = new RuleRepository();
    const bots = await botRepo.findAllForUser(user.id);

    return {
      success: true,
      message: "Database status",
      data: {
        botsCount: bots.length,
        userId: user.id,
        bots,
      },
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error checking database status",
    });
  }
});
