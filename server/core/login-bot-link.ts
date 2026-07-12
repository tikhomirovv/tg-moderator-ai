export const LOGIN_BOT_TOKEN_TTL_MS = 5 * 60 * 1000;
export const LOGIN_BOT_TOKEN_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
export const LOGIN_BOT_TOKEN_RATE_LIMIT_MAX = 3;

export type LoginBotTokenRecord = {
  id: string;
  token: string;
  telegram_id: number;
  username: string | null;
  name: string;
  expires_at: Date;
  consumed_at: Date | null;
  created_at: Date;
};

export type IssueLoginBotLinkInput = {
  telegramId: number;
  username?: string | null;
  name: string;
};

export type IssueLoginBotLinkResult =
  | { ok: true; url: string; expiresAt: Date }
  | { ok: false; code: "rate_limited"; message: string };

export type RedeemLoginBotTokenResult =
  | {
      ok: true;
      telegramId: number;
      username: string | null;
      name: string;
    }
  | {
      ok: false;
      code: "invalid" | "expired" | "consumed";
      message: string;
    };

export function isLoginBotStartCommand(text: string | undefined): boolean {
  if (!text) return false;
  const normalized = text.trim();
  if (normalized === "/login") return true;
  if (normalized.startsWith("/login@")) return true;
  if (normalized === "/start login") return true;
  if (normalized.startsWith("/start login@")) return true;
  return false;
}

export function buildLoginBotLinkUrl(baseUrl: string, token: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  return `${normalizedBase}/auth/bot-link?token=${encodeURIComponent(token)}`;
}
