import { BotRepository } from "../../database/repositories/bot-repository";
import {
  BotCreateValidationError,
  resolveBotIdentityFromGetMe,
} from "../../core/resolve-bot-from-token";
import { registerBotWebhook } from "../../utils/bot-lifecycle";
import { getBotDeliveryHealth, withDeliveryHealth } from "../../utils/bot-delivery";
import { requireSession } from "../../utils/session";
import { CreditService } from "../../core/credit-service";
import {
  TelegramBotApiError,
  telegramGetMe,
} from "../../utils/telegram-bot-api";
import {
  fetchBotProfilePhotoFileId,
  refreshBotAvatar,
} from "../../core/bot-avatar";

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
  let me;
  try {
    me = await telegramGetMe(rawToken.trim());
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
    let photoFileId: string | null = null;
    try {
      photoFileId = await fetchBotProfilePhotoFileId(
        identity.token,
        me.id
      );
    } catch {
      // Best effort — bot may have no profile photo.
    }

    const bot = await botRepo.create(user.id, {
      id: identity.id,
      name: identity.name,
      token: identity.token,
      telegram_bot_id: me.id,
      photo_file_id: photoFileId,
    });

    const creditService = new CreditService();
    await creditService.grantSignupCredits(bot.id);

    const refreshedBot = (await botRepo.findById(bot.id)) ?? bot;

    let warning: string | undefined;
    if (bot.is_active) {
      const botWithToken = await botRepo.findByIdWithToken(refreshedBot.id);
      if (botWithToken) {
        try {
          const registration = await registerBotWebhook(refreshedBot.id, botWithToken);
          warning = registration.warning;
        } catch (error) {
          warning =
            error instanceof Error
              ? error.message
              : "Failed to register webhook for new bot";
        }
      }
    }

    const health = await getBotDeliveryHealth(event, refreshedBot.id);

    return {
      success: true,
      data: withDeliveryHealth(refreshedBot, health),
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
