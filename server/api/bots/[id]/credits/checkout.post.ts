import { requireBotAccess } from "../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../utils/get-bot-id-param";
import { isSaasMode } from "../../../../core/deployment-mode";
import { createBillingProvider } from "../../../../core/billing/yookassa-provider";
import { resolveCreditPackage } from "../../../../core/credit-packages";
import {
  PromoService,
  promoValidationErrorMessage,
} from "../../../../core/promo-service";
import { ProviderPaymentRepository } from "../../../../database/repositories/provider-payment-repository";
import { getWebhookBaseUrl } from "../../../../utils/telegram-webhook";
import { readPromoCookie } from "../../../../utils/promo-cookie";

type CheckoutBody = {
  package_id?: string;
  promo_code?: string;
};

export default defineEventHandler(async (event) => {
  if (!isSaasMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Credits checkout is only available in SaaS mode",
    });
  }

  const botId = requireBotIdParam(event);
  const { user } = await requireBotAccess(event, botId);
  const body = (await readBody(event)) as CheckoutBody;
  const packageId = body?.package_id?.trim();

  if (!packageId || !resolveCreditPackage(packageId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid credit package",
    });
  }

  const baseUrl = getWebhookBaseUrl();
  if (!baseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "BASE_URL is not configured",
    });
  }

  const pkg = resolveCreditPackage(packageId)!;
  const promoService = new PromoService();
  const promoCode =
    body?.promo_code?.trim() || readPromoCookie(event) || undefined;

  let chargeAmountRub = pkg.amountRub;
  let promoCodeId: number | undefined;
  let appliedPromoCode: string | undefined;

  if (promoCode) {
    const validation = await promoService.validateForUser(promoCode, user.id);
    if (!validation.ok) {
      throw createError({
        statusCode: 400,
        statusMessage: promoValidationErrorMessage(validation.error),
      });
    }
    chargeAmountRub = promoService.computeDiscountedPrice(
      pkg.amountRub,
      validation.value.discount_percent
    );
    promoCodeId = validation.value.promo.id;
    appliedPromoCode = validation.value.promo.code;
  }

  const returnUrl = `${baseUrl}/bots/${botId}/credits?payment=return`;
  const provider = createBillingProvider();
  const checkout = await provider.createCheckout({
    botId,
    purchaserUserId: user.id,
    packageId,
    returnUrl,
    amountRub: chargeAmountRub,
    promoCode: appliedPromoCode,
  });

  const providerPayments = new ProviderPaymentRepository();
  await providerPayments.createPending({
    provider_payment_id: checkout.providerPaymentId,
    bot_id: botId,
    package_id: packageId,
    amount_rub: chargeAmountRub,
    credits: pkg.credits,
    purchaser_user_id: user.id,
    promo_code_id: promoCodeId ?? null,
  });

  return {
    success: true,
    data: {
      checkout_url: checkout.checkoutUrl,
      provider_payment_id: checkout.providerPaymentId,
    },
  };
});
