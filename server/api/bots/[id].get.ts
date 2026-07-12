import { BotRepository } from "../../database/repositories/bot-repository";
import { getBotDeliveryHealth, withDeliveryHealth } from "../../utils/bot-delivery";
import { requireBotAccess } from "../../utils/bot-access";
import { requireBotIdParam } from "../../utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  try {
    const botId = requireBotIdParam(event);
    const { role } = await requireBotAccess(event, botId);
    const botRepo = new BotRepository();

    const bot = await botRepo.findById(botId);

    if (!bot) {
      throw createError({
        statusCode: 404,
        statusMessage: "Bot not found",
      });
    }

    const health = await getBotDeliveryHealth(event, botId);

    return {
      success: true,
      data: withDeliveryHealth({ ...bot, my_role: role }, health),
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
