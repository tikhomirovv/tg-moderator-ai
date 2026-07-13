import type {
  TelegramBot,
  TelegramChatFull,
  ChatMember,
  ChatMemberAdministrator,
} from "../types/telegram";
import type { TelegramFetch } from "./telegram-fetch";

export class TelegramBotApiError extends Error {
  readonly code: "invalid_token" | "api_error";

  constructor(message: string, code: "invalid_token" | "api_error" = "api_error") {
    super(message);
    this.name = "TelegramBotApiError";
    this.code = code;
  }
}

async function callTelegramApi<T>(
  token: string,
  method: string,
  body: Record<string, unknown> | undefined,
  fetchFn: TelegramFetch
): Promise<T> {
  const init: RequestInit = body
    ? {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    : { method: "GET" };

  const response = await fetchFn(
    `https://api.telegram.org/bot${token}/${method}`,
    init
  );

  const data = (await response.json()) as {
    ok: boolean;
    description?: string;
    result?: T;
  };

  if (!data.ok || data.result === undefined) {
    const description = data.description || `Telegram ${method} failed`;
    const isUnauthorized =
      /unauthorized|invalid token|not found/i.test(description);
    throw new TelegramBotApiError(
      description,
      isUnauthorized ? "invalid_token" : "api_error"
    );
  }

  return data.result;
}

export async function telegramGetMe(
  token: string,
  fetchFn: TelegramFetch = fetch
): Promise<TelegramBot> {
  return callTelegramApi<TelegramBot>(token, "getMe", undefined, fetchFn);
}

export async function telegramGetChat(
  token: string,
  chatId: number,
  fetchFn: TelegramFetch = fetch
): Promise<TelegramChatFull> {
  return callTelegramApi<TelegramChatFull>(
    token,
    "getChat",
    { chat_id: chatId },
    fetchFn
  );
}

export async function telegramGetChatMember(
  token: string,
  chatId: number,
  userId: number,
  fetchFn: TelegramFetch = fetch
): Promise<ChatMember> {
  return callTelegramApi<ChatMember>(
    token,
    "getChatMember",
    { chat_id: chatId, user_id: userId },
    fetchFn
  );
}

export type TelegramFileInfo = {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
};

export async function telegramGetFile(
  token: string,
  fileId: string,
  fetchFn: TelegramFetch = fetch
): Promise<TelegramFileInfo> {
  return callTelegramApi<TelegramFileInfo>(
    token,
    "getFile",
    { file_id: fileId },
    fetchFn
  );
}

export function buildTelegramFileUrl(token: string, filePath: string): string {
  return `https://api.telegram.org/file/bot${token}/${filePath}`;
}

export async function telegramFetchFileStream(
  token: string,
  fileId: string,
  fetchFn: TelegramFetch = fetch
): Promise<{ response: Response; filePath: string }> {
  const file = await telegramGetFile(token, fileId, fetchFn);
  if (!file.file_path) {
    throw new TelegramBotApiError("Telegram file has no file_path", "api_error");
  }

  const response = await fetchFn(buildTelegramFileUrl(token, file.file_path));
  if (!response.ok) {
    throw new TelegramBotApiError(
      `Failed to download Telegram file: ${response.statusText}`,
      "api_error"
    );
  }

  return { response, filePath: file.file_path };
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

export function isChatMemberAdministrator(
  member: ChatMember
): member is ChatMemberAdministrator {
  return member.status === "administrator";
}
