import { BotMemberRepository } from "../../../../database/repositories/bot-member-repository";
import { requireBotAccess } from "../../../../utils/bot-access";

export default defineEventHandler(async (event) => {
  const botId = getRouterParam(event, "id");
  if (!botId) {
    throw createError({ statusCode: 400, statusMessage: "Bot ID is required" });
  }

  await requireBotAccess(event, botId);
  const memberRepo = new BotMemberRepository();
  const members = await memberRepo.listMembers(botId);

  return {
    success: true,
    data: { members },
  };
});
