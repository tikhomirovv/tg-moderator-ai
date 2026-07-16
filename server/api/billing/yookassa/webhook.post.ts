import { applyCreditPurchaseFromBillingEvent } from "../../../core/apply-credit-purchase";
import { createBillingProvider } from "../../../core/billing/yookassa-provider";
import { isSaasMode } from "../../../core/deployment-mode";
import { logger } from "../../../core/logger";

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

  const result = await applyCreditPurchaseFromBillingEvent(webhookEvent);
  if (result.status === "duplicate") {
    logger.info(
      { paymentId: webhookEvent.providerPaymentId },
      "Duplicate YooKassa webhook ignored"
    );
    return { success: true, duplicate: true };
  }

  if (result.status === "ignored") {
    return { success: true, ignored: true };
  }

  return { success: true };
});
