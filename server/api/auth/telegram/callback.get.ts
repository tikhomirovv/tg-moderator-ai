import { randomUUID } from "node:crypto";
import { exchangeTelegramCode, verifyTelegramIdToken } from "../../../utils/telegram-oidc";
import {
  clearOidcCookies,
  createUserSession,
  readOidcCookies,
} from "../../../utils/session";
import { UserRepository } from "../../../database/repositories/user-repository";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = typeof query.code === "string" ? query.code : null;
  const state = typeof query.state === "string" ? query.state : null;
  const { state: savedState, codeVerifier } = readOidcCookies(event);

  clearOidcCookies(event);

  if (!code || !state || !savedState || !codeVerifier) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid OAuth callback parameters",
    });
  }

  if (state !== savedState) {
    throw createError({
      statusCode: 403,
      statusMessage: "Invalid OAuth state",
    });
  }

  try {
    const idToken = await exchangeTelegramCode({
      code,
      codeVerifier,
    });
    const claims = await verifyTelegramIdToken(idToken);
    const userRepo = new UserRepository();
    const existing = await userRepo.findByTelegramId(claims.telegramId);
    const user = await userRepo.upsertFromTelegram(
      existing?.id ?? randomUUID(),
      {
        telegramId: claims.telegramId,
        username: claims.username,
        name: claims.name,
        photoUrl: claims.photoUrl,
      }
    );

    await createUserSession(event, user.id);
    return sendRedirect(event, "/");
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage:
        error instanceof Error ? error.message : "Telegram login failed",
    });
  }
});
