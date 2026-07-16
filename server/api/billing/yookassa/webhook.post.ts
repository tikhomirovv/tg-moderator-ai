import { CreditService } from "../../../core/credit-service";
import { createBillingProvider } from "../../../core/billing/yookassa-provider";
import { CreditTransactionRepository } from "../../../database/repositories/credit-transaction-repository";
import { logger } from "../../../core/logger";
import { isSaasMode } from "../../../core/deployment-mode";

export default defineEventHandler(async (event) => {
  if (!isSaasMode()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Billing webhooks are only enabled in SaaS mode",
    });
  }

  const payload = await readBody(event);
  const provider = createBillingProvider();
  const webhookEvent = await provider.verifyWebhook(
    payload,
    event.node.req.headers as unknown as Headers
  );

  if (!webhookEvent || webhookEvent.status !== "paid") {
    return { success: true, ignored: true };
  }

  const ledger = new CreditTransactionRepository();
  const duplicate = await ledger.findPurchaseByProviderPaymentId(
    webhookEvent.providerPaymentId
  );
  if (duplicate) {
    logger.info(
      { paymentId: webhookEvent.providerPaymentId },
      "Duplicate YooKassa webhook ignored"
    );
    return { success: true, duplicate: true };
  }

  const creditService = new CreditService();
  await creditService.grantPurchase({
    botId: webhookEvent.botId,
    credits: webhookEvent.credits,
    actorUserId: webhookEvent.purchaserUserId,
    providerPaymentId: webhookEvent.providerPaymentId,
    packageId: webhookEvent.packageId,
    amountRub: webhookEvent.amountRub,
  });

  logger.info(
    {
      botId: webhookEvent.botId,
      credits: webhookEvent.credits,
      paymentId: webhookEvent.providerPaymentId,
    },
    "Credits granted from YooKassa webhook"
  );

  return { success: true };
});
