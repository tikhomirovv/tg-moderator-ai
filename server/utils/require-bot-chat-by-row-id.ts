import type { H3Event } from "h3";
import { ChatRepository } from "../database/repositories/chat-repository";
import { requireBotIdParam } from "./get-bot-id-param";

export async function requireBotChatByRowId(
  event: H3Event,
  botId: string
): Promise<NonNullable<Awaited<ReturnType<ChatRepository["findByRowId"]>>>> {
  const chatRowIdParam = getRouterParam(event, "chatRowId");
  const chatRowId = Number(chatRowIdParam);
  if (!Number.isFinite(chatRowId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "chatRowId must be a number",
    });
  }

  const chatRepo = new ChatRepository();
  const chat = await chatRepo.findByRowId(botId, chatRowId);

  if (!chat) {
    throw createError({
      statusCode: 404,
      statusMessage: "Chat not found",
    });
  }

  return chat;
}
