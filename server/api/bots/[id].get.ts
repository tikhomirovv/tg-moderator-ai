import { BotRepository } from "../../database/repositories/bot-repository";

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "id");
    const botRepo = new BotRepository();

    const bot = await botRepo.findById(botId!);

    if (!bot) {
      throw createError({
        statusCode: 404,
        statusMessage: "Bot not found",
      });
    }

    return {
      success: true,
      data: bot,
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading bot",
    });
  }
});
