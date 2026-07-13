import type { H3Event } from "h3";

export function requireTelegramUserIdParam(event: H3Event): number {
  const raw = getRouterParam(event, "userId");
  const userId = Number(raw);
  if (!Number.isFinite(userId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "userId must be a number",
    });
  }
  return userId;
}
