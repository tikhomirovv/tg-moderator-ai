import { isSaasMode } from "../../core/deployment-mode";
import { ReferralService } from "../../core/referral-service";
import { requireSession } from "../../utils/session";

type ClaimBody = {
  bot_id?: string;
};

export default defineEventHandler(async (event) => {
  if (!isSaasMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Referral rewards are only available in SaaS mode",
    });
  }

  const { user } = await requireSession(event);
  const body = (await readBody(event)) as ClaimBody;
  const botId = body?.bot_id?.trim();

  if (!botId) {
    throw createError({
      statusCode: 400,
      statusMessage: "bot_id is required",
    });
  }

  const result = await new ReferralService().claimPending(user.id, botId);

  return {
    success: true,
    data: result,
  };
});
