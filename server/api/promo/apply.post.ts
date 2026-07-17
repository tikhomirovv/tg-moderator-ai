import { isSaasMode } from "../../core/deployment-mode";
import {
  PromoService,
  promoValidationErrorMessage,
} from "../../core/promo-service";
import { requireSession } from "../../utils/session";
import { setPromoCookie } from "../../utils/promo-cookie";
import { CREDIT_PACKAGES } from "../../../lib/credit-packages";

type ApplyBody = {
  code?: string;
};

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
  const body = (await readBody(event)) as ApplyBody;
  const code = body?.code?.trim();

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "Promo code is required",
    });
  }

  const promoService = new PromoService();
  const validation = await promoService.validateForUser(code, user.id);
  if (!validation.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: promoValidationErrorMessage(validation.error),
    });
  }

  setPromoCookie(event, validation.value.promo.code);

  return {
    success: true,
    data: {
      code: validation.value.promo.code,
      discount_percent: validation.value.discount_percent,
      packages: buildPackagePreview(validation.value.discount_percent),
    },
  };
});
