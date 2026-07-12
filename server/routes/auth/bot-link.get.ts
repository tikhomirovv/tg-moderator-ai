import { randomUUID } from "node:crypto";
import {
  createLoginBotTokenStore,
  redeemLoginBotToken,
} from "../../core/login-bot-webhook";
import { LoginBotTokenRepository } from "../../database/repositories/login-bot-token-repository";
import { UserRepository } from "../../database/repositories/user-repository";
import { createUserSession } from "../../utils/session";
import { DEFAULT_POST_LOGIN_PATH } from "../../../lib/auth-return-to";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = typeof query.token === "string" ? query.token : "";

  const repo = new LoginBotTokenRepository();
  const redemption = await redeemLoginBotToken(
    token,
    createLoginBotTokenStore(repo)
  );

  if (!redemption.ok) {
    throw createError({
      statusCode: redemption.code === "invalid" ? 400 : 401,
      statusMessage: redemption.message,
    });
  }

  const userRepo = new UserRepository();
  const existing = await userRepo.findByTelegramId(redemption.telegramId);
  const user = await userRepo.upsertFromTelegram(existing?.id ?? randomUUID(), {
    telegramId: redemption.telegramId,
    username: redemption.username,
    name: redemption.name,
    photoUrl: existing?.photoUrl ?? null,
  });

  await createUserSession(event, user.id);
  return sendRedirect(event, DEFAULT_POST_LOGIN_PATH);
});
