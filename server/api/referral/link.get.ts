import { isSaasMode } from "../../core/deployment-mode";
import { UserRepository } from "../../database/repositories/user-repository";
import { requireSession } from "../../utils/session";
import { getWebhookBaseUrl } from "../../utils/telegram-webhook";

export default defineEventHandler(async (event) => {
  if (!isSaasMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Referral rewards are only available in SaaS mode",
    });
  }

  const { user } = await requireSession(event);
  const users = new UserRepository();
  const code = await users.ensureReferralCode(user.id);
  const baseUrl = getWebhookBaseUrl() ?? "";

  return {
    success: true,
    data: {
      code,
      link: `${baseUrl}/r/${encodeURIComponent(code)}`,
    },
  };
});
