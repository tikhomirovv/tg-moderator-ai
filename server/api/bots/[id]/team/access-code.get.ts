import { BotAccessCodeRepository } from "../../../../database/repositories/bot-access-code-repository";
import { requireBotAccess } from "../../../../utils/bot-access";

export default defineEventHandler(async (event) => {
  const botId = getRouterParam(event, "id");
  if (!botId) {
    throw createError({ statusCode: 400, statusMessage: "Bot ID is required" });
  }

  await requireBotAccess(event, botId, ["owner"]);
  const codeRepo = new BotAccessCodeRepository();
  const code = await codeRepo.getOrCreateActiveCode(botId);

  return {
    success: true,
    data: {
      code: code.code,
      created_at: code.createdAt,
    },
  };
});
