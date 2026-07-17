import type { BillingWebhookEvent } from "./billing-provider";
import type { ProviderPaymentStatus } from "../database/models/provider-payment";
import { ProviderPaymentRepository } from "../database/repositories/provider-payment-repository";
import { PromoRedemptionRepository } from "../database/repositories/promo-code-repository";
import { ReferralService } from "./referral-service";
import { applyCreditPurchaseFromBillingEvent } from "./apply-credit-purchase";
import type { PaymentSyncStatus } from "./payment-sync";
import { logger } from "./logger";

export function mapBillingEventToProviderStatus(
  event: BillingWebhookEvent
): ProviderPaymentStatus {
  if (event.status === "paid") {
    return "succeeded";
  }
  if (event.status === "pending") {
    return "pending";
  }
  if (event.status === "refunded" || event.status === "failed") {
    return "canceled";
  }
  return "pending";
}

export type ReconcileProviderPaymentDeps = {
  providerPayments?: ProviderPaymentRepository;
  promoRedemptions?: PromoRedemptionRepository;
} & Parameters<typeof applyCreditPurchaseFromBillingEvent>[1];

/**
 * Update provider_payments row from YooKassa state and grant credits when succeeded.
 * Idempotent: credited row or ledger duplicate → duplicate.
 */
export async function reconcileProviderPayment(
  event: BillingWebhookEvent,
  deps: ReconcileProviderPaymentDeps = {}
): Promise<PaymentSyncStatus> {
  const repo = deps.providerPayments ?? new ProviderPaymentRepository();
  const row = await repo.findByProviderPaymentId(event.providerPaymentId);

  if (!row) {
    return "not_found";
  }

  if (row.bot_id !== event.botId) {
    return "forbidden";
  }

  if (row.status === "credited") {
    return "duplicate";
  }

  const nextStatus = mapBillingEventToProviderStatus(event);
  if (row.status !== nextStatus) {
    await repo.updateStatus(event.providerPaymentId, nextStatus);
  }

  if (nextStatus === "canceled") {
    return "pending";
  }

  if (nextStatus !== "succeeded") {
    return "pending";
  }

  const applyResult = await applyCreditPurchaseFromBillingEvent(event, {
    ...deps,
    providerPayments: repo,
  });
  if (applyResult.status === "applied") {
    await repo.markCredited(event.providerPaymentId);
    if (row.promo_code_id) {
      const promoRedemptions =
        deps.promoRedemptions ?? new PromoRedemptionRepository();
      try {
        await promoRedemptions.createIdempotent({
          promo_code_id: row.promo_code_id,
          user_id: row.purchaser_user_id,
          provider_payment_id: event.providerPaymentId,
        });
      } catch (error) {
        logger.error(
          {
            paymentId: event.providerPaymentId,
            promoCodeId: row.promo_code_id,
            error,
          },
          "Failed to record promo redemption after successful payment"
        );
        throw error;
      }
    }

    const referralResult = await new ReferralService().processPaidPurchase({
      providerPaymentId: event.providerPaymentId,
      refereeUserId: row.purchaser_user_id,
      botId: row.bot_id,
      baseCredits: row.credits,
      referralCodeFromCheckout: row.referral_code,
    });
    if (referralResult.status === "applied") {
      logger.info(
        {
          paymentId: event.providerPaymentId,
          referralId: referralResult.referral_id,
        },
        "Referral rewards applied for first purchase"
      );
    }

    return "applied";
  }
  if (applyResult.status === "duplicate") {
    await repo.markCredited(event.providerPaymentId);
    return "duplicate";
  }

  return "pending";
}
