import { BotRepository } from "../database/repositories/bot-repository";
import type { TelegramUserProfilePhotos } from "../types/telegram";
import {
  telegramGetMe,
  telegramGetUserProfilePhotos,
} from "../utils/telegram-bot-api";
import type { TelegramFetch } from "../utils/telegram-fetch";
import { logger } from "./logger";

export function resolveProfilePhotoFileId(
  profile: TelegramUserProfilePhotos
): string | null {
  const latestSet = profile.photos[profile.photos.length - 1];
  if (!latestSet?.length) {
    return null;
  }

  const biggest = latestSet[latestSet.length - 1];
  return biggest?.file_id ?? null;
}

export async function fetchBotProfilePhotoFileId(
  token: string,
  telegramBotId: number,
  fetchFn: TelegramFetch = fetch
): Promise<string | null> {
  const profile = await telegramGetUserProfilePhotos(
    token,
    telegramBotId,
    { limit: 1 },
    fetchFn
  );
  return resolveProfilePhotoFileId(profile);
}

export type RefreshBotAvatarResult = {
  photo_file_id: string | null;
  telegram_bot_id: number;
};

/** Best-effort avatar fetch from Telegram; persists photo_file_id and telegram_bot_id. */
export async function refreshBotAvatar(
  botId: string,
  fetchFn: TelegramFetch = fetch
): Promise<RefreshBotAvatarResult | null> {
  const botRepo = new BotRepository();
  const bot = await botRepo.findByIdWithToken(botId);
  if (!bot?.token) {
    return null;
  }

  let telegramBotId = bot.telegram_bot_id ?? null;
  if (!telegramBotId) {
    try {
      const me = await telegramGetMe(bot.token, fetchFn);
      telegramBotId = me.id;
    } catch (error) {
      logger.warn({ error: error as Error, botId }, "Failed to resolve bot id for avatar");
      return null;
    }
  }

  let photoFileId: string | null = null;
  try {
    photoFileId = await fetchBotProfilePhotoFileId(
      bot.token,
      telegramBotId,
      fetchFn
    );
  } catch (error) {
    logger.warn(
      { error: error as Error, botId, telegramBotId },
      "Failed to fetch bot profile photos"
    );
  }

  await botRepo.updateAvatarMetadata(botId, {
    telegramBotId,
    photoFileId,
  });

  return {
    photo_file_id: photoFileId,
    telegram_bot_id: telegramBotId,
  };
}
