import { BotMemberRepository } from "../../../../../database/repositories/bot-member-repository";
import { requireBotAccess } from "../../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../../utils/get-bot-id-param";

export default defineEventHandler(async (event) => {
  const botId = requireBotIdParam(event);
  const userId = getRouterParam(event, "userId");

  if (!botId || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bot ID and user ID are required",
    });
  }

  const { user, role } = await requireBotAccess(event, botId);
  if (userId === user.id && role === "owner") {
    throw createError({
      statusCode: 400,
      statusMessage: "Owner cannot remove themselves",
    });
  }

  const memberRepo = new BotMemberRepository();
  const targetRole = await memberRepo.getMemberRole(botId, userId);
  if (targetRole === "owner") {
    throw createError({
      statusCode: 400,
      statusMessage: "Cannot remove bot owner",
    });
  }

  const removed = await memberRepo.removeMember(botId, userId);
  if (!removed) {
    throw createError({ statusCode: 404, statusMessage: "Member not found" });
  }

  return {
    success: true,
    message: "Member removed",
  };
});
