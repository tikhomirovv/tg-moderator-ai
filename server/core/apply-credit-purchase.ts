import type { BillingWebhookEvent } from "./billing-provider";
import { CreditService } from "./credit-service";
import { CreditTransactionRepository } from "../database/repositories/credit-transaction-repository";
import { logger } from "./logger";

export type ApplyCreditPurchaseResult =
  | { status: "applied" }
  | { status: "duplicate" }
  | { status: "ignored"; reason: string };

/** Idempotent grant from a verified billing event (webhook or API sync). */
export async function applyCreditPurchaseFromBillingEvent(
  event: BillingWebhookEvent,
  deps: {
    creditService?: CreditService;
    ledger?: CreditTransactionRepository;
  } = {}
): Promise<ApplyCreditPurchaseResult> {
  if (event.status !== "paid") {
    return { status: "ignored", reason: "not_paid" };
  }

  const ledger = deps.ledger ?? new CreditTransactionRepository();
  const duplicate = await ledger.findPurchaseByProviderPaymentId(
    event.providerPaymentId
  );
  if (duplicate) {
    return { status: "duplicate" };
  }

  const creditService = deps.creditService ?? new CreditService();
  await creditService.grantPurchase({
    botId: event.botId,
    credits: event.credits,
    actorUserId: event.purchaserUserId,
    providerPaymentId: event.providerPaymentId,
    packageId: event.packageId,
    amountRub: event.amountRub,
  });

  logger.info(
    {
      botId: event.botId,
      credits: event.credits,
      paymentId: event.providerPaymentId,
    },
    "Credits granted from billing event"
  );

  return { status: "applied" };
}
