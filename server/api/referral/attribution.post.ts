import { isSaasMode } from "../../core/deployment-mode";
import { UserRepository } from "../../database/repositories/user-repository";
import { getSessionUser } from "../../utils/session";
import { normalizeReferralCode, setReferralCookie } from "../../utils/referral-cookie";

type AttributionBody = {
  code?: string;
};

export default defineEventHandler(async (event) => {
  if (!isSaasMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Referral attribution is only available in SaaS mode",
    });
  }

  const body = (await readBody(event)) as AttributionBody;
  const code = body?.code?.trim();
  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "Referral code is required",
    });
  }

  const normalized = normalizeReferralCode(code);
  const users = new UserRepository();
  const referrer = await users.findByReferralCode(normalized);
  if (!referrer) {
    throw createError({
      statusCode: 404,
      statusMessage: "Referral code not found",
    });
  }

  const sessionUser = await getSessionUser(event);
  if (sessionUser && sessionUser.id === referrer.id) {
    return { success: true, ignored: true, reason: "self_referral" };
  }

  setReferralCookie(event, normalized);

  return { success: true, data: { code: normalized } };
});
