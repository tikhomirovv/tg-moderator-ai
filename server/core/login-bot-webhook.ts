import type { TelegramUpdate } from "../../types/telegram";
import { isLoginBotStartCommand } from "../../core/login-bot-link";
import { LoginBotTokenRepository } from "../../database/repositories/login-bot-token-repository";
import {
  issueLoginBotLink,
  redeemLoginBotToken,
} from "../../utils/login-bot-token-service";
import { telegramSendMessage } from "../../utils/telegram-bot-api";
import {
  assertTelegramLoginWebhookSecret,
  getTelegramLoginBotToken,
} from "../../utils/telegram-login-bot";
import { logger } from "../../core/logger";

function createLoginBotTokenStore(repo: LoginBotTokenRepository) {
  return {
    countRecentByTelegramId: (telegramId: number, since: Date) =>
      repo.countRecentByTelegramId(telegramId, since),
    insert: (row: Parameters<LoginBotTokenRepository["insert"]>[0]) =>
      repo.insert(row),
    findByToken: (token: string) => repo.findByToken(token),
    markConsumed: (token: string, consumedAt: Date) =>
      repo.markConsumed(token, consumedAt),
  };
}

export async function handleLoginBotUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message?.text || !message.from || message.from.is_bot) {
    return;
  }

  if (!isLoginBotStartCommand(message.text)) {
    return;
  }

  const repo = new LoginBotTokenRepository();
  const result = await issueLoginBotLink(
    {
      telegramId: message.from.id,
      username: message.from.username ?? null,
      name: message.from.first_name || message.from.username || String(message.from.id),
    },
    createLoginBotTokenStore(repo)
  );

  const token = getTelegramLoginBotToken();

  if (!result.ok) {
    await telegramSendMessage(token, message.chat.id, result.message);
    return;
  }

  const reply =
    `Вот одноразовая ссылка для входа (действует 5 минут):\n` +
    `<a href="${result.url}">Открыть TG Moderator</a>\n\n` +
    `Ссылку можно использовать только один раз.`;

  await telegramSendMessage(token, message.chat.id, reply);
  logger.info({ telegramId: message.from.id }, "Issued login bot link");
}

export { redeemLoginBotToken, createLoginBotTokenStore };
