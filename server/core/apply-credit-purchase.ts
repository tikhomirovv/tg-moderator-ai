import type { BillingWebhookEvent } from "./billing-provider";
import { CreditService } from "./credit-service";
import { CreditTransactionRepository } from "../database/repositories/credit-transaction-repository";
import { PromoCodeRepository } from "../database/repositories/promo-code-repository";
import { ProviderPaymentRepository } from "../database/repositories/provider-payment-repository";
import { resolveCreditPackage } from "./credit-packages";
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
    providerPayments?: ProviderPaymentRepository;
    promoCodes?: PromoCodeRepository;
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

  const providerPayments = deps.providerPayments;
  const paymentRow = providerPayments
    ? await providerPayments.findByProviderPaymentId(event.providerPaymentId)
    : null;

  const pkg = resolveCreditPackage(event.packageId);
  const originalAmountRub = pkg?.amountRub ?? event.amountRub;

  let promoCode: string | undefined;
  if (paymentRow?.promo_code_id) {
    const promoRepo = deps.promoCodes ?? new PromoCodeRepository();
    const promo = await promoRepo.findById(paymentRow.promo_code_id);
    promoCode = promo?.code;
  }

  const creditService = deps.creditService ?? new CreditService();
  await creditService.grantPurchase({
    botId: event.botId,
    credits: event.credits,
    actorUserId: event.purchaserUserId,
    providerPaymentId: event.providerPaymentId,
    packageId: event.packageId,
    amountRub: event.amountRub,
    originalAmountRub,
    promoCode,
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
