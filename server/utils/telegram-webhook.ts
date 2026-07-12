export type TelegramFetch = typeof fetch;

export type TelegramWebhookInfo = {
  url?: string;
  last_error_date?: number;
  last_error_message?: string;
  pending_update_count?: number;
};

export function getWebhookBaseUrl(): string | null {
  const baseUrl = process.env.BASE_URL?.trim();
  if (!baseUrl || !baseUrl.startsWith("https://")) {
    return null;
  }
  return baseUrl.replace(/\/$/, "");
}

export function buildWebhookUrl(baseUrl: string, botId: string): string {
  return `${baseUrl}/api/telegram/webhook/${botId}`;
}

export async function telegramSetWebhook(
  token: string,
  url: string,
  fetchFn: TelegramFetch = fetch,
  secretToken?: string
): Promise<void> {
  const body: Record<string, unknown> = {
    url,
    allowed_updates: ["message", "edited_message", "my_chat_member"],
  };

  if (secretToken) {
    body.secret_token = secretToken;
  }

  const response = await fetchFn(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = (await response.json()) as { ok: boolean; description?: string };
  if (!data.ok) {
    throw new Error(data.description || "Failed to set webhook");
  }
}

export async function telegramDeleteWebhook(
  token: string,
  fetchFn: TelegramFetch = fetch
): Promise<void> {
  const response = await fetchFn(
    `https://api.telegram.org/bot${token}/deleteWebhook`
  );

  const data = (await response.json()) as { ok: boolean; description?: string };
  if (!data.ok) {
    throw new Error(data.description || "Failed to delete webhook");
  }
}

export async function telegramGetWebhookInfo(
  token: string,
  fetchFn: TelegramFetch = fetch
): Promise<TelegramWebhookInfo> {
  const response = await fetchFn(
    `https://api.telegram.org/bot${token}/getWebhookInfo`
  );

  const data = (await response.json()) as {
    ok: boolean;
    description?: string;
    result?: TelegramWebhookInfo;
  };

  if (!data.ok || !data.result) {
    throw new Error(data.description || "Failed to get webhook info");
  }

  return data.result;
}
