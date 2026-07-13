import { BotRepository } from "../database/repositories/bot-repository";
import { UserContextRepository } from "../database/repositories/user-context-repository";
import {
  createDefaultPardonDeps,
  pardonUserInChat,
  type PardonOperation,
} from "../core/pardon-service";
import { requireBotAccess } from "./bot-access";
import { requireBotIdParam } from "./get-bot-id-param";
import { requireBotChat } from "./require-bot-chat";
import { requireTelegramUserIdParam } from "./require-telegram-user-id-param";

export async function executePardonOperation(
  event: Parameters<typeof requireBotAccess>[0],
  operation: PardonOperation
) {
  const botId = requireBotIdParam(event);
  const { user, role } = await requireBotAccess(event, botId);
  const chat = await requireBotChat(event, botId);
  const userId = requireTelegramUserIdParam(event);

  const botRepo = new BotRepository();
  const bot = await botRepo.findByIdWithToken(botId);
  if (!bot?.token) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bot token is not configured",
    });
  }

  const body = (await readBody(event).catch(() => ({}))) as {
    reason?: string;
  };

  const result = await pardonUserInChat(
    {
      botId,
      botToken: bot.token,
      telegramChatId: chat.chatId,
      userId,
      operation,
      moderatorUserId: user.id,
      moderatorRole: role,
      reason: body.reason,
    },
    createDefaultPardonDeps()
  );

  if (!result.ok) {
    if (result.message === "Insufficient bot permissions") {
      throw createError({ statusCode: 403, statusMessage: result.message });
    }
    if (result.code === "user_not_found") {
      throw createError({ statusCode: 404, statusMessage: result.message });
    }
    throw createError({ statusCode: 502, statusMessage: result.message });
  }

  return {
    success: true,
    data: {
      user: result.user,
      actions: result.actions,
    },
  };
}

export function parseUsersPaginationQuery(
  query: Record<string, unknown>
): { page: number; limit: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 25));
  return { page, limit };
}

function mapChatUserRow(row: {
  user_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  warnings_count: number;
  is_banned: boolean;
  banned_at?: Date | string | null;
  last_activity: Date | string;
}) {
  return {
    user_id: row.user_id,
    username: row.username ?? null,
    first_name: row.first_name ?? null,
    last_name: row.last_name ?? null,
    warnings_count: row.warnings_count,
    is_banned: row.is_banned,
    banned_at: row.banned_at ?? null,
    last_activity: row.last_activity,
  };
}

export async function listChatUsers(event: Parameters<typeof requireBotAccess>[0]) {
  const botId = requireBotIdParam(event);
  await requireBotAccess(event, botId);
  const chat = await requireBotChat(event, botId);
  const { page, limit } = parseUsersPaginationQuery(
    getQuery(event) as Record<string, unknown>
  );

  const userRepo = new UserContextRepository();
  const [users, total] = await Promise.all([
    userRepo.listSanctionedByChat(botId, chat.chatId, { page, limit }),
    userRepo.countSanctionedByChat(botId, chat.chatId),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    success: true,
    data: {
      users: users.map(mapChatUserRow),
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    },
  };
}
