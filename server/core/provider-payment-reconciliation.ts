import type { BillingWebhookEvent } from "./billing-provider";
import type { ProviderPaymentStatus } from "../database/models/provider-payment";
import { ProviderPaymentRepository } from "../database/repositories/provider-payment-repository";
import { applyCreditPurchaseFromBillingEvent } from "./apply-credit-purchase";
import type { PaymentSyncStatus } from "./payment-sync";

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

  const applyResult = await applyCreditPurchaseFromBillingEvent(event, deps);
  if (applyResult.status === "applied") {
    await repo.markCredited(event.providerPaymentId);
    return "applied";
  }
  if (applyResult.status === "duplicate") {
    await repo.markCredited(event.providerPaymentId);
    return "duplicate";
  }

  return "pending";
}
