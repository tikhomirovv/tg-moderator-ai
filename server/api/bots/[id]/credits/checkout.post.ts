import { requireBotAccess } from "../../../../utils/bot-access";
import { requireBotIdParam } from "../../../../utils/get-bot-id-param";
import { isSaasMode } from "../../../../core/deployment-mode";
import { createBillingProvider } from "../../../../core/billing/yookassa-provider";
import { resolveCreditPackage } from "../../../../core/credit-packages";
import { ProviderPaymentRepository } from "../../../../database/repositories/provider-payment-repository";
import { getWebhookBaseUrl } from "../../../../utils/telegram-webhook";

type CheckoutBody = {
  package_id?: string;
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

  const returnUrl = `${baseUrl}/bots/${botId}/credits?payment=return`;
  const provider = createBillingProvider();
  const pkg = resolveCreditPackage(packageId)!;
  const checkout = await provider.createCheckout({
    botId,
    purchaserUserId: user.id,
    packageId,
    returnUrl,
  });

  const providerPayments = new ProviderPaymentRepository();
  await providerPayments.createPending({
    provider_payment_id: checkout.providerPaymentId,
    bot_id: botId,
    package_id: packageId,
    amount_rub: pkg.amountRub,
    credits: pkg.credits,
    purchaser_user_id: user.id,
  });

  return {
    success: true,
    data: {
      checkout_url: checkout.checkoutUrl,
      provider_payment_id: checkout.providerPaymentId,
    },
  };
});
