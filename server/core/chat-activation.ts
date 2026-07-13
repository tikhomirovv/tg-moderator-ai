import type { BotMemberRole } from "../database/repositories/bot-member-repository";
import { BotMemberRepository } from "../database/repositories/bot-member-repository";
import type { BotChatRow } from "../database/repositories/chat-repository";
import type { ChatHealthStatus } from "../database/repositories/chat-repository";
import { ChatRepository } from "../database/repositories/chat-repository";
import { ChatActivationPendingRepository } from "../database/repositories/chat-activation-pending-repository";
import { UserRepository } from "../database/repositories/user-repository";
import type {
  ChatMember,
  ChatMemberAdministrator,
  TelegramChatFull,
  TelegramUpdate,
} from "../types/telegram";
import {
  isChatMemberAdministrator,
  telegramGetChat,
  telegramGetChatMember,
} from "../utils/telegram-bot-api";
import type { TelegramFetch } from "../utils/telegram-fetch";

export type ChatActivationErrorCode =
  | "not_owner"
  | "not_platform_member"
  | "anonymous_admin"
  | "insufficient_rights"
  | "bot_not_admin"
  | "bot_not_member"
  | "private_chat"
  | "api_error";

export interface RegisteredChat {
  id: number;
  chat_id: number;
  name: string;
  silent_mode: boolean;
  photo_file_id: string | null;
  telegram_username: string | null;
  health_status: ChatHealthStatus;
  health_message: string | null;
  health_checked_at: Date;
}

export type ChatActivationResult =
  | { ok: true; chat: RegisteredChat }
  | { ok: false; code: ChatActivationErrorCode; message: string };

export interface ChatHealthSnapshot {
  status: ChatHealthStatus;
  message: string;
  checked_at: Date;
  photo_file_id: string | null;
  telegram_username: string | null;
  name: string;
}

export type ActivateChatForBotParams = {
  botId: string;
  botToken: string;
  telegramChatId: number;
  activatedByTelegramId: number;
  botAdminMember: ChatMemberAdministrator;
  fetchFn?: TelegramFetch;
};

export type ActivateChatDeps = {
  getMemberRoleByTelegramId: (
    botId: string,
    telegramId: number
  ) => Promise<BotMemberRole | null>;
  getChatMember: (
    token: string,
    chatId: number,
    userId: number,
    fetchFn?: TelegramFetch
  ) => Promise<ChatMember>;
  getChat: (
    token: string,
    chatId: number,
    fetchFn?: TelegramFetch
  ) => Promise<TelegramChatFull>;
  upsertActivatedChat: (input: {
    botId: string;
    telegramChatId: number;
    name: string;
    photoFileId: string | null;
    telegramUsername: string | null;
    healthStatus: ChatHealthStatus;
    healthMessage: string | null;
    healthCheckedAt: Date;
  }) => Promise<BotChatRow>;
  completePendingForUser: (
    botId: string,
    userId: string,
    chatRowId: number
  ) => Promise<void>;
  failPendingForUser: (
    botId: string,
    userId: string,
    code: ChatActivationErrorCode,
    message: string
  ) => Promise<void>;
  resolvePlatformUserId: (
    telegramId: number
  ) => Promise<string | null>;
};

export function evaluateAdministratorRights(
  member: ChatMemberAdministrator
): { ok: true } | { ok: false; message: string } {
  const missing: string[] = [];
  if (!member.can_delete_messages) {
    missing.push("delete messages");
  }
  if (!member.can_restrict_members) {
    missing.push("restrict members");
  }

  if (missing.length > 0) {
    return {
      ok: false,
      message: `Bot needs administrator rights: ${missing.join(", ")}`,
    };
  }

  return { ok: true };
}

export function mapChatRowToRegisteredChat(row: BotChatRow): RegisteredChat {
  return {
    id: row.id,
    chat_id: row.chatId,
    name: row.name,
    silent_mode: row.silentMode,
    photo_file_id: row.photoFileId,
    telegram_username: row.telegramUsername,
    health_status: row.healthStatus ?? "unhealthy",
    health_message: row.healthMessage,
    health_checked_at: row.healthCheckedAt ?? new Date(),
  };
}

export function resolveChatTitle(chat: TelegramChatFull): string {
  const title = chat.title?.trim();
  if (title) {
    return title;
  }
  if (chat.username) {
    return `@${chat.username}`;
  }
  return `Chat ${chat.id}`;
}

export async function evaluateChatHealth(
  botToken: string,
  telegramChatId: number,
  botTelegramUserId: number,
  deps: {
    getChatMember: (
      token: string,
      chatId: number,
      userId: number,
      fetchFn?: TelegramFetch
    ) => Promise<ChatMember>;
    getChat: (
      token: string,
      chatId: number,
      fetchFn?: TelegramFetch
    ) => Promise<TelegramChatFull>;
    fetchFn?: TelegramFetch;
  }
): Promise<ChatHealthSnapshot> {
  const checkedAt = new Date();
  const fetchFn = deps.fetchFn;

  try {
    const [member, chat] = await Promise.all([
      deps.getChatMember(botToken, telegramChatId, botTelegramUserId, fetchFn),
      deps.getChat(botToken, telegramChatId, fetchFn),
    ]);

    const photoFileId = chat.photo?.big_file_id ?? null;
    const telegramUsername = chat.username ?? null;
    const name = resolveChatTitle(chat);

    if (!isChatMemberAdministrator(member)) {
      const statusMessage =
        member.status === "left" || member.status === "kicked"
          ? "Bot is not a member of this chat"
          : "Bot is not an administrator in this chat";

      return {
        status: "unhealthy",
        message: statusMessage,
        checked_at: checkedAt,
        photo_file_id: photoFileId,
        telegram_username: telegramUsername,
        name,
      };
    }

    const rights = evaluateAdministratorRights(member);
    if (!rights.ok) {
      return {
        status: "degraded",
        message: rights.message,
        checked_at: checkedAt,
        photo_file_id: photoFileId,
        telegram_username: telegramUsername,
        name,
      };
    }

    return {
      status: "ok",
      message: "Chat is ready for moderation",
      checked_at: checkedAt,
      photo_file_id: photoFileId,
      telegram_username: telegramUsername,
      name,
    };
  } catch {
    return {
      status: "unhealthy",
      message: "Failed to check chat health via Telegram API",
      checked_at: checkedAt,
      photo_file_id: null,
      telegram_username: null,
      name: `Chat ${telegramChatId}`,
    };
  }
}

export async function activateChatForBot(
  params: ActivateChatForBotParams,
  deps: ActivateChatDeps
): Promise<ChatActivationResult> {
  const fetchFn = params.fetchFn;
  const role = await deps.getMemberRoleByTelegramId(
    params.botId,
    params.activatedByTelegramId
  );

  if (!role) {
    return {
      ok: false,
      code: "not_platform_member",
      message: "Only bot members on the platform can connect chats",
    };
  }

  const platformUserId = await deps.resolvePlatformUserId(
    params.activatedByTelegramId
  );
  if (!platformUserId) {
    return {
      ok: false,
      code: "not_platform_member",
      message: "Platform account not found for this Telegram user",
    };
  }

  try {
    const activatingMember = await deps.getChatMember(
      params.botToken,
      params.telegramChatId,
      params.activatedByTelegramId,
      fetchFn
    );

    if (
      isChatMemberAdministrator(activatingMember) &&
      activatingMember.is_anonymous
    ) {
      const fail = {
        ok: false as const,
        code: "anonymous_admin" as const,
        message:
          "Disable “Remain anonymous” in Telegram group admin settings and run /activate again",
      };
      await deps.failPendingForUser(
        params.botId,
        platformUserId,
        fail.code,
        fail.message
      );
      return fail;
    }

    const rights = evaluateAdministratorRights(params.botAdminMember);
    if (!rights.ok) {
      const fail = {
        ok: false as const,
        code: "insufficient_rights" as const,
        message: rights.message,
      };
      await deps.failPendingForUser(
        params.botId,
        platformUserId,
        fail.code,
        fail.message
      );
      return fail;
    }

    const chat = await deps.getChat(
      params.botToken,
      params.telegramChatId,
      fetchFn
    );

    if (chat.type === "private") {
      const fail = {
        ok: false as const,
        code: "private_chat" as const,
        message: "Only group chats can be connected",
      };
      await deps.failPendingForUser(
        params.botId,
        platformUserId,
        fail.code,
        fail.message
      );
      return fail;
    }

    const health = await evaluateChatHealth(
      params.botToken,
      params.telegramChatId,
      params.botAdminMember.user.id,
      {
        getChatMember: deps.getChatMember,
        getChat: deps.getChat,
        fetchFn,
      }
    );

    const row = await deps.upsertActivatedChat({
      botId: params.botId,
      telegramChatId: params.telegramChatId,
      name: health.name,
      photoFileId: health.photo_file_id,
      telegramUsername: health.telegram_username,
      healthStatus: health.status,
      healthMessage: health.message,
      healthCheckedAt: health.checked_at,
    });

    await deps.completePendingForUser(params.botId, platformUserId, row.id);

    return {
      ok: true,
      chat: mapChatRowToRegisteredChat(row),
    };
  } catch {
    const fail = {
      ok: false as const,
      code: "api_error" as const,
      message: "Failed to activate chat via Telegram API",
    };
    await deps.failPendingForUser(
      params.botId,
      platformUserId,
      fail.code,
      fail.message
    );
    return fail;
  }
}

export function createDefaultActivateChatDeps(
  overrides: Partial<ActivateChatDeps> = {}
): ActivateChatDeps {
  const memberRepo = new BotMemberRepository();
  const userRepo = new UserRepository();
  const chatRepo = new ChatRepository();
  const pendingRepo = new ChatActivationPendingRepository();

  const base: ActivateChatDeps = {
    getMemberRoleByTelegramId: async (botId, telegramId) => {
      const user = await userRepo.findByTelegramId(telegramId);
      if (!user) {
        return null;
      }
      return memberRepo.getMemberRole(botId, user.id);
    },
    getChatMember: (token, chatId, userId, fetchFn) =>
      telegramGetChatMember(token, chatId, userId, fetchFn),
    getChat: (token, chatId, fetchFn) =>
      telegramGetChat(token, chatId, fetchFn),
    upsertActivatedChat: (input) => chatRepo.upsertActivatedChat(input),
    completePendingForUser: async (botId, userId, chatRowId) => {
      const pending = await pendingRepo.findLatestWaitingForUser(botId, userId);
      if (pending) {
        await pendingRepo.complete(pending.id, chatRowId);
      }
    },
    failPendingForUser: async (botId, userId, code, message) => {
      const pending = await pendingRepo.findLatestWaitingForUser(botId, userId);
      if (pending) {
        await pendingRepo.fail(pending.id, code, message);
      }
    },
    resolvePlatformUserId: async (telegramId) => {
      const user = await userRepo.findByTelegramId(telegramId);
      return user?.id ?? null;
    },
  };

  return { ...base, ...overrides };
}

export function isActivateCommandText(text: string | undefined): boolean {
  if (!text) {
    return false;
  }

  const command = text.trim().split(/\s+/)[0] ?? "";
  return command === "/activate" || command.startsWith("/activate@");
}

/** Webhook updates that register or connect a chat (processed even when bot is inactive). */
export function isChatActivationUpdate(update: TelegramUpdate): boolean {
  if (update.my_chat_member) {
    return true;
  }

  const text = update.message?.text ?? update.edited_message?.text;
  return isActivateCommandText(text);
}
