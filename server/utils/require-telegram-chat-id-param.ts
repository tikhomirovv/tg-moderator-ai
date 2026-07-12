import type { H3Event } from "h3";

export function requireTelegramChatIdParam(event: H3Event): number {
  const chatId = getRouterParam(event, "chatId");
  if (!chatId) {
    throw createError({
      statusCode: 400,
      statusMessage: "chatId is required",
    });
  }

  const parsed = Number(chatId);
  if (!Number.isFinite(parsed)) {
    throw createError({
      statusCode: 400,
      statusMessage: "chatId must be a number",
    });
  }

  return parsed;
}
