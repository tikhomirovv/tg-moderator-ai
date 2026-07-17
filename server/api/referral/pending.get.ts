import { isSaasMode } from "../../core/deployment-mode";
import { ReferralService } from "../../core/referral-service";
import { requireSession } from "../../utils/session";

export default defineEventHandler(async (event) => {
  if (!isSaasMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Referral rewards are only available in SaaS mode",
    });
  }

  const { user } = await requireSession(event);
  const summary = await new ReferralService().getPendingSummary(user.id);

  return {
    success: true,
    data: summary,
  };
});
