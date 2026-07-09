import { logger } from "../core/logger";
import type { BotResponse } from "../database/models/bot";
import { BotRepository } from "../database/repositories/bot-repository";
import {
  buildWebhookUrl,
  getWebhookBaseUrl,
  telegramDeleteWebhook,
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

export async function enableBot(
  botId: string,
  workspaceId: string,
  deps?: Partial<LifecycleDeps>
): Promise<BotLifecycleResult> {
  const { botRepo, fetchFn } = getDeps(deps);
  const current = await botRepo.findByIdWithToken(botId);

  if (!current || current.workspace_id !== workspaceId) {
    throw new BotLifecycleError(404, "Bot not found");
  }

  const updated = await botRepo.update(botId, workspaceId, { is_active: true });
  if (!updated) {
    throw new BotLifecycleError(404, "Bot not found");
  }

  const baseUrl = getWebhookBaseUrl();
  if (!current.token) {
    return {
      bot: updated,
      webhookRegistered: false,
      warning: "Bot is active but has no token configured",
    };
  }

  if (!baseUrl) {
    return {
      bot: updated,
      webhookRegistered: false,
      warning:
        "Bot is active but webhook is not configured (HTTPS BASE_URL required)",
    };
  }

  try {
    const webhookUrl = buildWebhookUrl(baseUrl, botId);
    const webhookSecret =
      current.webhook_secret ?? generateWebhookSecret();
    if (!current.webhook_secret) {
      await botRepo.setWebhookSecret(botId, webhookSecret);
    }

    await telegramSetWebhook(
      current.token,
      webhookUrl,
      fetchFn,
      webhookSecret
    );
    logger.info(`Webhook set for bot ${botId}: ${webhookUrl}`);
    return { bot: updated, webhookRegistered: true };
  } catch (error) {
    await botRepo.update(botId, workspaceId, { is_active: false });
    throw new BotLifecycleError(
      502,
      error instanceof Error ? error.message : "Failed to set webhook"
    );
  }
}

export async function disableBot(
  botId: string,
  workspaceId: string,
  deps?: Partial<LifecycleDeps>
): Promise<BotLifecycleResult> {
  const { botRepo, fetchFn } = getDeps(deps);
  const current = await botRepo.findByIdWithToken(botId);

  if (!current || current.workspace_id !== workspaceId) {
    throw new BotLifecycleError(404, "Bot not found");
  }

  const updated = await botRepo.update(botId, workspaceId, { is_active: false });
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
    await botRepo.update(botId, workspaceId, { is_active: true });
    throw new BotLifecycleError(
      502,
      error instanceof Error ? error.message : "Failed to delete webhook"
    );
  }
}
