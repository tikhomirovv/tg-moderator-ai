import { BotRepository } from "../../database/repositories/bot-repository";
import { CreateBotRequest } from "../../database/models/bot";
import { registerBotWebhook } from "../../utils/bot-lifecycle";
import {
  getBotDeliveryHealthForWorkspace,
  withDeliveryHealth,
} from "../../utils/bot-delivery";

export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody(event)) as CreateBotRequest;
    const workspaceId = getWorkspaceId(event);
    const botRepo = new BotRepository();

    const bot = await botRepo.create(workspaceId, body);

    let warning: string | undefined;
    if (bot.is_active) {
      const botWithToken = await botRepo.findByIdWithToken(bot.id);
      if (botWithToken) {
        try {
          const registration = await registerBotWebhook(bot.id, botWithToken);
          warning = registration.warning;
        } catch (error) {
          warning =
            error instanceof Error
              ? error.message
              : "Failed to register webhook for new bot";
        }
      }
    }

    const health = await getBotDeliveryHealthForWorkspace(bot.id, workspaceId);

    return {
      success: true,
      data: withDeliveryHealth(bot, health),
      warning,
      message: "Bot created successfully",
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error creating bot",
    });
  }
});
