import { logger } from "../core/logger";
import type { Bot, BotResponse } from "../database/models/bot";
import { BotRepository } from "../database/repositories/bot-repository";
import {
  buildWebhookUrl,
  getWebhookBaseUrl,
  telegramDeleteWebhook,
  telegramGetWebhookInfo,
  telegramSetWebhook,
  type TelegramFetch,
} from "./telegram-webhook";
import { generateWebhookSecret } from "./webhook-auth";

export class BotLifecycleError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "BotLifecycleError";
  }
}

export type BotLifecycleResult = {
  bot: BotResponse;
  webhookRegistered: boolean;
  warning?: string;
};

type LifecycleDeps = {
  botRepo: BotRepository;
  fetchFn: TelegramFetch;
};

function getDeps(overrides?: Partial<LifecycleDeps>): LifecycleDeps {
  return {
    botRepo: overrides?.botRepo ?? new BotRepository(),
    fetchFn: overrides?.fetchFn ?? fetch,
  };
}

export async function registerBotWebhook(
  botId: string,
  botConfig: Pick<Bot, "token" | "webhook_secret">,
  deps?: Partial<LifecycleDeps>
): Promise<{ registered: boolean; warning?: string }> {
  const { botRepo, fetchFn } = getDeps(deps);

  if (!botConfig.token) {
    return {
      registered: false,
      warning: "Bot is active but has no token configured",
    };
  }

  const baseUrl = getWebhookBaseUrl();
  if (!baseUrl) {
    return {
      registered: false,
      warning:
        "Bot is active but webhook is not configured (HTTPS BASE_URL required)",
    };
  }

  const webhookUrl = buildWebhookUrl(baseUrl, botId);
  const webhookSecret = botConfig.webhook_secret ?? generateWebhookSecret();
  if (!botConfig.webhook_secret) {
    await botRepo.setWebhookSecret(botId, webhookSecret);
  }

  await telegramSetWebhook(
    botConfig.token,
    webhookUrl,
    fetchFn,
    webhookSecret
  );
  logger.info(`Webhook set for bot ${botId}: ${webhookUrl}`);
  return { registered: true };
}

export async function enableBot(
  botId: string,
  deps?: Partial<LifecycleDeps>
): Promise<BotLifecycleResult> {
  const { botRepo, fetchFn } = getDeps(deps);
  const current = await botRepo.findByIdWithToken(botId);

  if (!current) {
    throw new BotLifecycleError(404, "Bot not found");
  }

  const updated = await botRepo.update(botId, { is_active: true });
  if (!updated) {
    throw new BotLifecycleError(404, "Bot not found");
  }

  try {
    const registration = await registerBotWebhook(
      botId,
      current,
      { botRepo, fetchFn }
    );
    return {
      bot: updated,
      webhookRegistered: registration.registered,
      warning: registration.warning,
    };
  } catch (error) {
    await botRepo.update(botId, { is_active: false });
    throw new BotLifecycleError(
      502,
      error instanceof Error ? error.message : "Failed to set webhook"
    );
  }
}

export async function disableBot(
  botId: string,
  deps?: Partial<LifecycleDeps>
): Promise<BotLifecycleResult> {
  const { botRepo, fetchFn } = getDeps(deps);
  const current = await botRepo.findByIdWithToken(botId);

  if (!current) {
    throw new BotLifecycleError(404, "Bot not found");
  }

  const updated = await botRepo.update(botId, { is_active: false });
  if (!updated) {
    throw new BotLifecycleError(404, "Bot not found");
  }

  if (!current.token) {
    return { bot: updated, webhookRegistered: false };
  }

  try {
    await telegramDeleteWebhook(current.token, fetchFn);
    logger.info(`Webhook removed for bot ${botId}`);
    return { bot: updated, webhookRegistered: false };
  } catch (error) {
    await botRepo.update(botId, { is_active: true });
    throw new BotLifecycleError(
      502,
      error instanceof Error ? error.message : "Failed to delete webhook"
    );
  }
}

export async function reconcileBotWebhook(
  botId: string,
  botConfig: Pick<Bot, "token" | "webhook_secret" | "is_active">,
  deps?: Partial<LifecycleDeps>
): Promise<void> {
  const { botRepo, fetchFn } = getDeps(deps);

  if (!botConfig.is_active || !botConfig.token) {
    return;
  }

  const baseUrl = getWebhookBaseUrl();
  if (!baseUrl) {
    logger.warn(
      { botId },
      "Skipping webhook reconcile: HTTPS BASE_URL is not configured"
    );
    return;
  }

  const expectedUrl = buildWebhookUrl(baseUrl, botId);

  try {
    const info = await telegramGetWebhookInfo(botConfig.token, fetchFn);
    if (info.url === expectedUrl) {
      return;
    }

    logger.warn(
      {
        botId,
        currentUrl: info.url ?? null,
        expectedUrl,
        lastError: info.last_error_message,
      },
      "Webhook URL mismatch — re-registering"
    );

    await registerBotWebhook(botId, botConfig, { botRepo, fetchFn });
  } catch (error) {
    logger.error(
      { error: error as Error, botId },
      "Failed to reconcile webhook"
    );
  }
}
