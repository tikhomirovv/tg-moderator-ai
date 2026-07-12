import type { H3Event } from "h3";
import { ChatRepository } from "../database/repositories/chat-repository";
import type { BotChatRow } from "../database/repositories/chat-repository";
import { requireTelegramChatIdParam } from "./require-telegram-chat-id-param";

export async function requireBotChat(
  event: H3Event,
  botId: string
): Promise<BotChatRow> {
  const telegramChatId = requireTelegramChatIdParam(event);
  const chatRepo = new ChatRepository();
  const chat = await chatRepo.findByTelegramChatId(botId, telegramChatId);

  if (!chat) {
    throw createError({
      statusCode: 404,
      statusMessage: "Chat not found",
    });
  }

  return chat;
}
