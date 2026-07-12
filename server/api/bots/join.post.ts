import { BotAccessCodeRepository } from "../../database/repositories/bot-access-code-repository";
import { BotMemberRepository } from "../../database/repositories/bot-member-repository";
import { joinBotWithAccessCode } from "../../core/bot-team-join";
import { requireSession } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as { code?: string };
  const code = body?.code?.trim();

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "Access code is required",
    });
  }

  const { user } = await requireSession(event);
  const codeRepo = new BotAccessCodeRepository();
  const memberRepo = new BotMemberRepository();

  const result = await joinBotWithAccessCode(user.id, code, {
    findActiveByCode: (value) => codeRepo.findActiveByCode(value),
    getMemberRole: (botId, userId) => memberRepo.getMemberRole(botId, userId),
    addMember: (botId, userId, role) =>
      memberRepo.addMember(botId, userId, role),
  });

  if (!result.ok) {
    throw createError({
      statusCode: 404,
      statusMessage: "Invalid or revoked access code",
    });
  }

  return {
    success: true,
    data: { bot_id: result.botId },
    message: result.alreadyOwner ? "You already own this bot" : "Joined bot team",
  };
});
