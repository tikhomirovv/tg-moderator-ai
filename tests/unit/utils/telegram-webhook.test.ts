import { afterEach, describe, expect, test } from "bun:test";
import {
  buildWebhookUrl,
  getWebhookBaseUrl,
  telegramDeleteWebhook,
  telegramSetWebhook,
} from "../../../server/utils/telegram-webhook";

const originalBaseUrl = process.env.BASE_URL;

afterEach(() => {
  if (originalBaseUrl === undefined) {
    delete process.env.BASE_URL;
  } else {
    process.env.BASE_URL = originalBaseUrl;
  }
});

describe("telegram-webhook utils", () => {
  test("getWebhookBaseUrl accepts only HTTPS URLs", () => {
    process.env.BASE_URL = "https://example.com/";
    expect(getWebhookBaseUrl()).toBe("https://example.com");

    process.env.BASE_URL = "http://localhost:3001";
    expect(getWebhookBaseUrl()).toBeNull();
  });

  test("buildWebhookUrl composes bot webhook path", () => {
    expect(buildWebhookUrl("https://example.com", "my-bot")).toBe(
      "https://example.com/api/telegram/webhook/my-bot"
    );
  });

  test("telegramSetWebhook calls Telegram API", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchFn = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ ok: true }));
    };

    await telegramSetWebhook(
      "token-1",
      "https://example.com/api/telegram/webhook/bot-1",
      fetchFn
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(
      "https://api.telegram.org/bottoken-1/setWebhook"
    );
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({
      url: "https://example.com/api/telegram/webhook/bot-1",
      allowed_updates: ["message", "edited_message"],
    });
  });

  test("telegramDeleteWebhook throws on Telegram error", async () => {
    const fetchFn = async () =>
      new Response(JSON.stringify({ ok: false, description: "bad token" }));

    await expect(telegramDeleteWebhook("bad-token", fetchFn)).rejects.toThrow(
      "bad token"
    );
  });
});
