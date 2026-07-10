import type { TelegramWebhookInfo } from "./telegram-webhook";

export type DeliveryStatus = "healthy" | "disabled" | "degraded" | "unavailable";

export type BotDeliveryHealth = {
  status: DeliveryStatus;
  message: string;
};

const FRESH_ERROR_MS = 15 * 60 * 1000;
const PENDING_UPDATES_THRESHOLD = 100;

const USER_PROBLEM_MESSAGE =
  "Moderation unavailable. Contact your administrator.";

export function evaluateDeliveryHealth(input: {
  isActive: boolean;
  hasToken: boolean;
  baseUrl: string | null;
  expectedWebhookUrl: string | null;
  webhookInfo: TelegramWebhookInfo | null;
  now?: number;
}): BotDeliveryHealth {
  const now = input.now ?? Date.now();

  if (!input.isActive) {
    return { status: "disabled", message: "Disabled" };
  }

  if (!input.hasToken) {
    return {
      status: "unavailable",
      message: USER_PROBLEM_MESSAGE,
    };
  }

  if (!input.baseUrl || !input.expectedWebhookUrl) {
    return {
      status: "unavailable",
      message: USER_PROBLEM_MESSAGE,
    };
  }

  if (!input.webhookInfo?.url) {
    return {
      status: "degraded",
      message: USER_PROBLEM_MESSAGE,
    };
  }

  if (input.webhookInfo.url !== input.expectedWebhookUrl) {
    return {
      status: "degraded",
      message: USER_PROBLEM_MESSAGE,
    };
  }

  if (input.webhookInfo.last_error_date) {
    const errorAt = input.webhookInfo.last_error_date * 1000;
    if (now - errorAt <= FRESH_ERROR_MS) {
      return {
        status: "degraded",
        message: USER_PROBLEM_MESSAGE,
      };
    }
  }

  if (
    (input.webhookInfo.pending_update_count ?? 0) > PENDING_UPDATES_THRESHOLD
  ) {
    return {
      status: "degraded",
      message: USER_PROBLEM_MESSAGE,
    };
  }

  return { status: "healthy", message: "Working" };
}
