import { isSaasMode } from "../../core/deployment-mode";
import {
  PromoService,
  promoValidationErrorMessage,
} from "../../core/promo-service";
import { requireSession } from "../../utils/session";
import { readPromoCookie } from "../../utils/promo-cookie";
import { CREDIT_PACKAGES } from "../../../lib/credit-packages";

function buildPackagePreview(discountPercent: number) {
  return Object.values(CREDIT_PACKAGES).map((pkg) => ({
    package_id: pkg.id,
    original_amount_rub: pkg.amountRub,
    discounted_amount_rub: Math.max(
      1,
      Math.floor((pkg.amountRub * (100 - discountPercent)) / 100)
    ),
    credits: pkg.credits,
  }));
}

export default defineEventHandler(async (event) => {
  if (!isSaasMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Promo codes are only available in SaaS mode",
    });
  }

  const { user } = await requireSession(event);
  const code = readPromoCookie(event);

  if (!code) {
    return { success: true, data: null };
  }

  const promoService = new PromoService();
  const validation = await promoService.validateForUser(code, user.id);
  if (!validation.ok) {
    return {
      success: true,
      data: {
        code,
        valid: false,
        error: promoValidationErrorMessage(validation.error),
      },
    };
  }

  return {
    success: true,
    data: {
      code: validation.value.promo.code,
      valid: true,
      discount_percent: validation.value.discount_percent,
      packages: buildPackagePreview(validation.value.discount_percent),
    },
  };
});
