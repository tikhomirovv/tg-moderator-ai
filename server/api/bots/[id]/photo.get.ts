import { BotRepository } from "../../../database/repositories/bot-repository";
import { requireBotAccess } from "../../../utils/bot-access";
import { requireBotIdParam } from "../../../utils/get-bot-id-param";
import { telegramFetchFileStream } from "../../../utils/telegram-bot-api";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);
  await requireBotAccess(event, botId);

  const botRepo = new BotRepository();
  const bot = await botRepo.findByIdWithToken(botId);
  if (!bot?.photo_file_id) {
    throw createError({
      statusCode: 404,
      statusMessage: "Bot photo not found",
    });
  }

  if (!bot.token) {
    throw createError({
      statusCode: 404,
      statusMessage: "Bot token not found",
    });
  }

  const { response, filePath } = await telegramFetchFileStream(
    bot.token,
    bot.photo_file_id
  );

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  setHeader(event, "Content-Type", contentType);
  setHeader(event, "Cache-Control", "private, max-age=3600");

  const extension = filePath.split(".").pop()?.toLowerCase();
  if (extension) {
    setHeader(
      event,
      "Content-Disposition",
      `inline; filename="bot-photo.${extension}"`
    );
  }

  return sendStream(event, response.body!);
});
