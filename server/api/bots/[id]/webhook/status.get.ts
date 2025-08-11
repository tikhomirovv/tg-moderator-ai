import { BotRepository } from "../../../../database/repositories/bot-repository";
import { bots } from "../../../../index";

export default defineEventHandler(async (event) => {
  try {
    const botId = getRouterParam(event, "id");
    const bot = bots.get(botId!);

    if (!bot) {
      return {
        success: true,
        data: {
          active: false,
          url: null,
          last_update: null,
        },
      };
    }

    // Получаем токен из БД
    const botRepo = new BotRepository();
    const botWithToken = await botRepo.findByIdWithToken(botId!);

    if (!botWithToken?.token) {
      return {
        success: true,
        data: {
          active: false,
          url: null,
          last_update: null,
          error: "Token not found in database",
        },
      };
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botWithToken.token}/getWebhookInfo`
    );
    const webhookInfo = await response.json();

    if (!webhookInfo.ok) {
      return {
        success: true,
        data: {
          active: false,
          url: null,
          last_update: null,
          error: webhookInfo.description,
        },
      };
    }

    return {
      success: true,
      data: {
        active: !!webhookInfo.result.url,
        url: webhookInfo.result.url || null,
        last_update: webhookInfo.result.last_error_date
          ? new Date(webhookInfo.result.last_error_date * 1000)
          : null,
        pending_updates: webhookInfo.result.pending_update_count || 0,
      },
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error getting webhook status",
    });
  }
});
