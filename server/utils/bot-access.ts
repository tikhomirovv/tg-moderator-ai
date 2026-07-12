import type { H3Event } from "h3";
import { BotMemberRepository, type BotMemberRole } from "../database/repositories/bot-member-repository";
import { requireSession } from "./session";

export async function requireBotAccess(
  event: H3Event,
  botId: string,
  roles?: BotMemberRole[]
) {
  const { user } = await requireSession(event);
  const memberRepo = new BotMemberRepository();
  const role = await memberRepo.getMemberRole(botId, user.id);

  if (!role) {
    throw createError({
      statusCode: 403,
      statusMessage: "No access to this bot",
    });
  }

  if (roles && !roles.includes(role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Insufficient bot permissions",
    });
  }

  return { user, role };
}

export async function getAccessibleBotIds(event: H3Event): Promise<string[]> {
  const { user } = await requireSession(event);
  const memberRepo = new BotMemberRepository();
  return memberRepo.getAccessibleBotIds(user.id);
}
