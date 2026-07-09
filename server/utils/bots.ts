import { BotRepository } from "../database/repositories/bot-repository";
import type { Bot } from "../database/models/bot";

export async function getBotForWorkspace(
  botId: string,
  workspaceId: string
): Promise<Bot> {
  const botRepo = new BotRepository();
  const bot = await botRepo.findByIdWithToken(botId);

  if (!bot || bot.workspace_id !== workspaceId) {
    throw createError({
      statusCode: 404,
      statusMessage: "Bot not found",
    });
  }

  return bot;
}
