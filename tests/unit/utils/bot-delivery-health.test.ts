import { describe, expect, test } from "bun:test";
import { evaluateDeliveryHealth } from "../../../server/utils/bot-delivery-health";

const NOW = new Date("2026-07-10T12:00:00.000Z").getTime();

describe("evaluateDeliveryHealth", () => {
  test("returns disabled when bot is inactive", () => {
    const health = evaluateDeliveryHealth({
      isActive: false,
      hasToken: true,
      baseUrl: "https://example.com",
      expectedWebhookUrl:
        "https://example.com/api/telegram/webhook/my-bot",
      webhookInfo: { url: "https://example.com/api/telegram/webhook/my-bot" },
      now: NOW,
    });

    expect(health.status).toBe("disabled");
    expect(health.message).toBe("Disabled");
  });

  test("returns degraded when webhook URL mismatches BASE_URL", () => {
    const health = evaluateDeliveryHealth({
      isActive: true,
      hasToken: true,
      baseUrl: "https://example.com",
      expectedWebhookUrl:
        "https://example.com/api/telegram/webhook/my-bot",
      webhookInfo: {
        url: "https://old.example.com/api/telegram/webhook/my-bot",
      },
      now: NOW,
    });

    expect(health.status).toBe("degraded");
  });

  test("returns degraded on fresh Telegram delivery error", () => {
    const health = evaluateDeliveryHealth({
      isActive: true,
      hasToken: true,
      baseUrl: "https://example.com",
      expectedWebhookUrl:
        "https://example.com/api/telegram/webhook/my-bot",
      webhookInfo: {
        url: "https://example.com/api/telegram/webhook/my-bot",
        last_error_date: Math.floor((NOW - 5 * 60 * 1000) / 1000),
        last_error_message: "Connection refused",
      },
      now: NOW,
    });

    expect(health.status).toBe("degraded");
  });

  test("returns healthy when URL matches and no fresh errors", () => {
    const health = evaluateDeliveryHealth({
      isActive: true,
      hasToken: true,
      baseUrl: "https://example.com",
      expectedWebhookUrl:
        "https://example.com/api/telegram/webhook/my-bot",
      webhookInfo: {
        url: "https://example.com/api/telegram/webhook/my-bot",
        last_error_date: Math.floor((NOW - 60 * 60 * 1000) / 1000),
      },
      now: NOW,
    });

    expect(health.status).toBe("healthy");
    expect(health.message).toBe("Working");
  });
});
