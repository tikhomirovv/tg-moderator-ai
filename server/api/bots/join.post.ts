import { BotAccessCodeRepository } from "../../database/repositories/bot-access-code-repository";
import { BotMemberRepository } from "../../database/repositories/bot-member-repository";
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
  const accessCode = await codeRepo.findActiveByCode(code);

  if (!accessCode) {
    throw createError({
      statusCode: 404,
      statusMessage: "Invalid or revoked access code",
    });
  }

  const memberRepo = new BotMemberRepository();
  const existingRole = await memberRepo.getMemberRole(accessCode.botId, user.id);
  if (existingRole === "owner") {
    return {
      success: true,
      data: { bot_id: accessCode.botId },
      message: "You already own this bot",
    };
  }

  await memberRepo.addMember(accessCode.botId, user.id, "manager");

  return {
    success: true,
    data: { bot_id: accessCode.botId },
    message: "Joined bot team",
  };
});
