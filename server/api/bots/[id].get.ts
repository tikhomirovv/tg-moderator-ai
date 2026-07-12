import { BotRepository } from "../../database/repositories/bot-repository";
import { getBotDeliveryHealth, withDeliveryHealth } from "../../utils/bot-delivery";
import { requireBotAccess } from "../../utils/bot-access";

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "id");
    await requireBotAccess(event, botId!);
    const botRepo = new BotRepository();

    const bot = await botRepo.findById(botId!);

    if (!bot) {
      throw createError({
        statusCode: 404,
        statusMessage: "Bot not found",
      });
    }

    const health = await getBotDeliveryHealth(event, botId!);

    return {
      success: true,
      data: withDeliveryHealth(bot, health),
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Error loading bot",
    });
  }
});
