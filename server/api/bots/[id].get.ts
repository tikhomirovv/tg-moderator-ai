import { BotRepository } from "../../database/repositories/bot-repository";
import { getBotDeliveryHealth, withDeliveryHealth } from "../../utils/bot-delivery";
import { requireBotAccess } from "../../utils/bot-access";
import { requireBotIdParam } from "../../utils/get-bot-id-param";
import { refreshBotAvatar } from "../../core/bot-avatar";

export default defineEventHandler(async (event) => {
  try {
    const botId = requireBotIdParam(event);
    const { user, role } = await requireBotAccess(event, botId);
    const botRepo = new BotRepository();

    let bot = await botRepo.findById(botId);

    if (!bot) {
      throw createError({
        statusCode: 404,
        statusMessage: "Bot not found",
      });
    }

    if (!bot.photo_file_id) {
      await refreshBotAvatar(botId);
      bot = (await botRepo.findById(botId)) ?? bot;
    }

    const health = await getBotDeliveryHealth(event, botId);

    return {
      success: true,
      data: withDeliveryHealth({ ...bot, my_role: role, my_user_id: user.id }, health),
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
