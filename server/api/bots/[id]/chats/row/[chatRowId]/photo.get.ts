import { BotRepository } from "../../../../../../database/repositories/bot-repository";
import { ChatRepository } from "../../../../../../database/repositories/chat-repository";
import { requireBotAccess } from "../../../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../../../utils/get-bot-id-param";
import { telegramFetchFileStream } from "../../../../../../utils/telegram-bot-api";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);
  await requireBotAccess(event, botId);

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
  if (!chat?.photoFileId) {
    throw createError({
      statusCode: 404,
      statusMessage: "Chat photo not found",
    });
  }

  const botRepo = new BotRepository();
  const bot = await botRepo.findByIdWithToken(botId);
  if (!bot?.token) {
    throw createError({
      statusCode: 404,
      statusMessage: "Bot token not found",
    });
  }

  const { response, filePath } = await telegramFetchFileStream(
    bot.token,
    chat.photoFileId
  );

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  setHeader(event, "Content-Type", contentType);
  setHeader(event, "Cache-Control", "private, max-age=3600");

  const extension = filePath.split(".").pop()?.toLowerCase();
  if (extension) {
    setHeader(
      event,
      "Content-Disposition",
      `inline; filename="chat-photo.${extension}"`
    );
  }

  return sendStream(event, response.body!);
});
