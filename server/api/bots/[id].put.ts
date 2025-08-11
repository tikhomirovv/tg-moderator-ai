import { BotRepository } from "../../database/repositories/bot-repository";
import { UpdateBotRequest } from "../../database/models/bot";

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "id");
    const body = (await readBody(event)) as UpdateBotRequest;
    const botRepo = new BotRepository();

    const bot = await botRepo.update(botId!, body);

    if (!bot) {
      throw createError({
        statusCode: 404,
        statusMessage: "Bot not found",
      });
    }

    return {
      success: true,
      data: bot,
      message: "Bot updated successfully",
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error updating bot",
    });
  }
});
