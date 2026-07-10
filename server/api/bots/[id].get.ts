import { BotRepository } from "../../database/repositories/bot-repository";
import {
  getBotDeliveryHealthForWorkspace,
  withDeliveryHealth,
} from "../../utils/bot-delivery";

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "id");
    const workspaceId = getWorkspaceId(event);
    const botRepo = new BotRepository();

    const bot = await botRepo.findById(botId!, workspaceId);

    if (!bot) {
      throw createError({
        statusCode: 404,
        statusMessage: "Bot not found",
      });
    }

    const health = await getBotDeliveryHealthForWorkspace(botId!, workspaceId);

    return {
      success: true,
      data: withDeliveryHealth(bot, health),
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading bot",
    });
  }
});
