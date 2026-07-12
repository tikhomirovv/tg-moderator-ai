import type { BotMemberRole } from "../database/repositories/bot-member-repository";

export type JoinBotResult =
  | { ok: true; botId: string; alreadyOwner: boolean }
  | { ok: false; reason: "invalid_code" };

export async function joinBotWithAccessCode(
  userId: string,
  code: string,
  deps: {
    findActiveByCode: (
      code: string
    ) => Promise<{ botId: string } | null>;
    getMemberRole: (botId: string, userId: string) => Promise<BotMemberRole | null>;
    addMember: (
      botId: string,
      userId: string,
      role: BotMemberRole
    ) => Promise<void>;
  }
): Promise<JoinBotResult> {
  const trimmed = code.trim();
  if (!trimmed) {
    return { ok: false, reason: "invalid_code" };
  }

  const accessCode = await deps.findActiveByCode(trimmed);
  if (!accessCode) {
    return { ok: false, reason: "invalid_code" };
  }

  const existingRole = await deps.getMemberRole(accessCode.botId, userId);
  if (existingRole === "owner") {
    return { ok: true, botId: accessCode.botId, alreadyOwner: true };
  }

  await deps.addMember(accessCode.botId, userId, "manager");
  return { ok: true, botId: accessCode.botId, alreadyOwner: false };
}
