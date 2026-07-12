import { randomUUID } from "node:crypto";
import {
  buildLoginBotLinkUrl,
  LOGIN_BOT_TOKEN_RATE_LIMIT_MAX,
  LOGIN_BOT_TOKEN_RATE_LIMIT_WINDOW_MS,
  LOGIN_BOT_TOKEN_TTL_MS,
  type IssueLoginBotLinkInput,
  type IssueLoginBotLinkResult,
  type RedeemLoginBotTokenResult,
} from "../core/login-bot-link";
import { getWebhookBaseUrl } from "./telegram-webhook";

type LoginBotTokenStore = {
  countRecentByTelegramId: (
    telegramId: number,
    since: Date
  ) => Promise<number>;
  insert: (row: {
    id: string;
    token: string;
    telegramId: number;
    username: string | null;
    name: string;
    expiresAt: Date;
  }) => Promise<void>;
  findByToken: (token: string) => Promise<{
    telegramId: number;
    username: string | null;
    name: string;
    expiresAt: Date;
    consumedAt: Date | null;
  } | null>;
  markConsumed: (token: string, consumedAt: Date) => Promise<boolean>;
};

export async function issueLoginBotLink(
  input: IssueLoginBotLinkInput,
  store: LoginBotTokenStore
): Promise<IssueLoginBotLinkResult> {
  const baseUrl = getWebhookBaseUrl();
  if (!baseUrl) {
    throw new Error("BASE_URL must be a valid HTTPS URL");
  }

  const since = new Date(Date.now() - LOGIN_BOT_TOKEN_RATE_LIMIT_WINDOW_MS);
  const recentCount = await store.countRecentByTelegramId(input.telegramId, since);
  if (recentCount >= LOGIN_BOT_TOKEN_RATE_LIMIT_MAX) {
    return {
      ok: false,
      code: "rate_limited",
      message: "Too many login links requested. Try again in a few minutes.",
    };
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + LOGIN_BOT_TOKEN_TTL_MS);

  await store.insert({
    id: randomUUID(),
    token,
    telegramId: input.telegramId,
    username: input.username ?? null,
    name: input.name,
    expiresAt,
  });

  return {
    ok: true,
    url: buildLoginBotLinkUrl(baseUrl, token),
    expiresAt,
  };
}

export async function redeemLoginBotToken(
  token: string,
  store: LoginBotTokenStore
): Promise<RedeemLoginBotTokenResult> {
  const trimmed = token.trim();
  if (!trimmed) {
    return { ok: false, code: "invalid", message: "Login link is invalid" };
  }

  const row = await store.findByToken(trimmed);
  if (!row) {
    return { ok: false, code: "invalid", message: "Login link is invalid" };
  }

  if (row.consumedAt) {
    return {
      ok: false,
      code: "consumed",
      message: "Login link was already used",
    };
  }

  if (row.expiresAt.getTime() <= Date.now()) {
    return { ok: false, code: "expired", message: "Login link has expired" };
  }

  const consumed = await store.markConsumed(trimmed, new Date());
  if (!consumed) {
    return {
      ok: false,
      code: "consumed",
      message: "Login link was already used",
    };
  }

  return {
    ok: true,
    telegramId: row.telegramId,
    username: row.username,
    name: row.name,
  };
}
