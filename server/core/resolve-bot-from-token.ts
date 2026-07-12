import type { TelegramBot } from "../types/telegram";

export class BotCreateValidationError extends Error {
  readonly code: "missing_token" | "missing_username";

  constructor(message: string, code: "missing_token" | "missing_username") {
    super(message);
    this.name = "BotCreateValidationError";
    this.code = code;
  }
}

export type ResolvedBotIdentity = {
  id: string;
  name: string;
  token: string;
};

/** Maps Telegram getMe result to platform bot id/name. */
export function resolveBotIdentityFromGetMe(
  me: Pick<TelegramBot, "username" | "first_name">,
  token: string
): ResolvedBotIdentity {
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    throw new BotCreateValidationError("Bot token is required", "missing_token");
  }

  const username = me.username?.trim().toLowerCase();
  if (!username) {
    throw new BotCreateValidationError(
      "Bot must have a username in @BotFather",
      "missing_username"
    );
  }

  const name = me.first_name?.trim() || username;

  return {
    id: username,
    name,
    token: trimmedToken,
  };
}
