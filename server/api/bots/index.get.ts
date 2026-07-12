import { BotRepository } from "../../database/repositories/bot-repository";
import { requireSession } from "../../utils/session";

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireSession(event);
    const botRepo = new BotRepository();
    const bots = await botRepo.findAllForUser(user.id);

    return {
      success: true,
      data: {
        bots,
      },
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading bots from database",
    });
  }
});
