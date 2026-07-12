import { handleLoginBotUpdate } from "../../../core/login-bot-webhook";
import { assertTelegramLoginWebhookSecret } from "../../../utils/telegram-login-bot";
import { logger } from "../../../core/logger";

export default defineEventHandler(async (event) => {
  const secretToken = getHeader(event, "x-telegram-bot-api-secret-token");

  try {
    assertTelegramLoginWebhookSecret(secretToken);
  } catch (error) {
    logger.warn("Rejected login bot webhook with invalid secret");
    throw error;
  }

  const body = await readBody(event);
  await handleLoginBotUpdate(body);
  return { ok: true };
});
