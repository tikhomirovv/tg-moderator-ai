import { BotRepository } from "../../database/repositories/bot-repository";

export default defineEventHandler(async (event) => {
  try {
    const botRepo = new BotRepository();
    const bots = await botRepo.findAll();

    return {
      success: true,
      data: {
        bots: bots,
      },
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading bots from database",
    });
  }
});
