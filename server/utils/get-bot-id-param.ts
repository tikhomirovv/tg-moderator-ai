import type { H3Event } from "h3";
import { getRouterParam } from "h3";

/** Read bot id from Nitro `[id]` route param. */
export function getBotIdParam(event: H3Event): string | undefined {
  return getRouterParam(event, "id");
}

/** Require bot id or throw 400. */
export function requireBotIdParam(event: H3Event): string {
  const botId = getBotIdParam(event);
  if (!botId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bot ID is required",
    });
  }
  return botId;
}
