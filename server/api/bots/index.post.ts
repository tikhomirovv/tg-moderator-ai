import { BotRepository } from "../../database/repositories/bot-repository";
import {
  BotCreateValidationError,
  resolveBotIdentityFromGetMe,
} from "../../core/resolve-bot-from-token";
import { registerBotWebhook } from "../../utils/bot-lifecycle";
import { getBotDeliveryHealth, withDeliveryHealth } from "../../utils/bot-delivery";
import { requireSession } from "../../utils/session";
import {
  TelegramBotApiError,
  telegramGetMe,
} from "../../utils/telegram-bot-api";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as { token?: string };
  const rawToken = body?.token;

  if (typeof rawToken !== "string" || !rawToken.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bot token is required",
    });
  }

  const { user } = await requireSession(event);
  const botRepo = new BotRepository();

  let identity;
  try {
    const me = await telegramGetMe(rawToken.trim());
    identity = resolveBotIdentityFromGetMe(me, rawToken);
  } catch (error) {
    if (error instanceof BotCreateValidationError) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message,
      });
    }

    if (error instanceof TelegramBotApiError) {
      throw createError({
        statusCode: error.code === "invalid_token" ? 401 : 400,
        statusMessage: error.message,
      });
    }

    throw error;
  }

  const existing = await botRepo.findById(identity.id);
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "Bot already registered",
    });
  }

  try {
    const bot = await botRepo.create(user.id, {
      id: identity.id,
      name: identity.name,
      token: identity.token,
    });

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

    const health = await getBotDeliveryHealth(event, bot.id);

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
      cause: error,
    });
  }
});
