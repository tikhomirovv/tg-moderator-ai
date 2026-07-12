import { BotMemberRepository } from "../../../../database/repositories/bot-member-repository";
import { requireBotAccess } from "../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);

  await requireBotAccess(event, botId);
  const memberRepo = new BotMemberRepository();
  const members = await memberRepo.listMembers(botId);

  return {
    success: true,
    data: { members },
  };
});
