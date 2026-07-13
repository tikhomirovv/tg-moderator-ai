import type { BotMemberRole } from "../database/repositories/bot-member-repository";
import { ModerationActionRepository } from "../database/repositories/moderation-action-repository";
import { UserContextRepository } from "../database/repositories/user-context-repository";
import type { UserContext } from "../database/models/user-context";
import type { ModerationActionType } from "../database/models/moderation-action";
import { telegramUnbanChatMember } from "../utils/telegram-bot-api";
import type { TelegramFetch } from "../utils/telegram-fetch";

export type PardonOperation = "pardon" | "reset_warnings" | "unban";

export type PardonUserResult =
  | { ok: true; user: UserContext; actions: ModerationActionType[] }
  | { ok: false; code: "user_not_found" | "telegram_error"; message: string };

export type PardonUserParams = {
  botId: string;
  botToken: string;
  telegramChatId: number;
  userId: number;
  operation: PardonOperation;
  moderatorUserId: string;
  moderatorRole: BotMemberRole;
  reason?: string;
  fetchFn?: TelegramFetch;
};

export function canModeratorPardon(_role: BotMemberRole): boolean {
  return _role === "owner" || _role === "manager";
}

function buildAuditReason(
  operation: PardonOperation,
  moderatorUserId: string,
  moderatorRole: BotMemberRole,
  reason?: string
): string {
  const base = `Manual ${operation} by ${moderatorRole} ${moderatorUserId}`;
  return reason?.trim() ? `${base}: ${reason.trim()}` : base;
}

export async function pardonUserInChat(
  params: PardonUserParams,
  deps: {
    findUser: (
      botId: string,
      chatId: number,
      userId: number
    ) => Promise<UserContext | null>;
    resetWarnings: (
      botId: string,
      chatId: number,
      userId: number
    ) => Promise<UserContext | null>;
    clearBan: (
      botId: string,
      chatId: number,
      userId: number
    ) => Promise<UserContext | null>;
    unbanInTelegram: (
      token: string,
      chatId: number,
      userId: number,
      fetchFn?: TelegramFetch
    ) => Promise<void>;
    logAction: (
      input: Parameters<ModerationActionRepository["create"]>[0]
    ) => Promise<unknown>;
  }
): Promise<PardonUserResult> {
  if (!canModeratorPardon(params.moderatorRole)) {
    return {
      ok: false,
      code: "user_not_found",
      message: "Insufficient bot permissions",
    };
  }

  const existing = await deps.findUser(
    params.botId,
    params.telegramChatId,
    params.userId
  );
  if (!existing) {
    return {
      ok: false,
      code: "user_not_found",
      message: "User not found in this chat",
    };
  }

  const actions: ModerationActionType[] = [];
  const auditReason = buildAuditReason(
    params.operation,
    params.moderatorUserId,
    params.moderatorRole,
    params.reason
  );
  const now = new Date();
  let user = existing;

  try {
    if (params.operation === "reset_warnings" || params.operation === "pardon") {
      user =
        (await deps.resetWarnings(
          params.botId,
          params.telegramChatId,
          params.userId
        )) ?? user;
      actions.push("reset_warnings");
      await deps.logAction({
        bot_id: params.botId,
        chat_id: params.telegramChatId,
        user_id: params.userId,
        message_id: 0,
        action_type: "reset_warnings",
        ai_confidence: 1,
        ai_reasoning: auditReason,
        timestamp: now,
        moderator_bot_id: params.botId,
      });
    }

    if (params.operation === "unban" || params.operation === "pardon") {
      if (existing.is_banned) {
        await deps.unbanInTelegram(
          params.botToken,
          params.telegramChatId,
          params.userId,
          params.fetchFn
        );
      }

      user =
        (await deps.clearBan(
          params.botId,
          params.telegramChatId,
          params.userId
        )) ?? user;
      actions.push("unban");
      await deps.logAction({
        bot_id: params.botId,
        chat_id: params.telegramChatId,
        user_id: params.userId,
        message_id: 0,
        action_type: "unban",
        ai_confidence: 1,
        ai_reasoning: auditReason,
        timestamp: now,
        moderator_bot_id: params.botId,
      });
    }

    if (params.operation === "pardon" && actions.length > 0) {
      await deps.logAction({
        bot_id: params.botId,
        chat_id: params.telegramChatId,
        user_id: params.userId,
        message_id: 0,
        action_type: "pardon",
        ai_confidence: 1,
        ai_reasoning: auditReason,
        timestamp: now,
        moderator_bot_id: params.botId,
      });
      actions.push("pardon");
    }

    return { ok: true, user, actions };
  } catch (error) {
    return {
      ok: false,
      code: "telegram_error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to apply pardon via Telegram API",
    };
  }
}

export function createDefaultPardonDeps(
  overrides: Partial<Parameters<typeof pardonUserInChat>[1]> = {}
): Parameters<typeof pardonUserInChat>[1] {
  const userRepo = new UserContextRepository();
  const moderationRepo = new ModerationActionRepository();

  return {
    findUser: (botId, chatId, userId) =>
      userRepo.findByUser(botId, chatId, userId),
    resetWarnings: (botId, chatId, userId) =>
      userRepo.resetWarnings(botId, chatId, userId),
    clearBan: (botId, chatId, userId) =>
      userRepo.clearBan(botId, chatId, userId),
    unbanInTelegram: (token, chatId, userId, fetchFn) =>
      telegramUnbanChatMember(token, chatId, userId, fetchFn),
    logAction: (input) => moderationRepo.create(input),
    ...overrides,
  };
}
