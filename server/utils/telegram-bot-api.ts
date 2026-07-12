import type { TelegramBot } from "../types/telegram";

export type TelegramFetch = typeof fetch;

export class TelegramBotApiError extends Error {
  readonly code: "invalid_token" | "api_error";

  constructor(message: string, code: "invalid_token" | "api_error" = "api_error") {
    super(message);
    this.name = "TelegramBotApiError";
    this.code = code;
  }
}

export async function telegramGetMe(
  token: string,
  fetchFn: TelegramFetch = fetch
): Promise<TelegramBot> {
  const response = await fetchFn(`https://api.telegram.org/bot${token}/getMe`);
  const data = (await response.json()) as {
    ok: boolean;
    description?: string;
    result?: TelegramBot;
  };

  if (!data.ok || !data.result) {
    const description = data.description || "Invalid bot token";
    const isUnauthorized =
      /unauthorized|invalid token|not found/i.test(description);
    throw new TelegramBotApiError(
      description,
      isUnauthorized ? "invalid_token" : "api_error"
    );
  }

  return data.result;
}

export async function telegramSendMessage(
  token: string,
  chatId: number,
  text: string,
  fetchFn: TelegramFetch = fetch
): Promise<void> {
  const response = await fetchFn(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    }
  );

  const data = (await response.json()) as { ok: boolean; description?: string };
  if (!data.ok) {
    throw new TelegramBotApiError(
      data.description || "Failed to send Telegram message",
      "api_error"
    );
  }
}
