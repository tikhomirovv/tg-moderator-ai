import type { BillingProvider } from "./billing-provider";
import { createBillingProvider } from "./billing/yookassa-provider";
import {
  reconcileProviderPayment,
  type ReconcileProviderPaymentDeps,
} from "./provider-payment-reconciliation";
import { ProviderPaymentRepository } from "../database/repositories/provider-payment-repository";

export type PaymentSyncStatus =
  | "applied"
  | "duplicate"
  | "pending"
  | "not_found"
  | "forbidden";

export type PaymentSyncResult = {
  status: PaymentSyncStatus;
};

const STATUS_PRIORITY: Record<PaymentSyncStatus, number> = {
  applied: 5,
  duplicate: 4,
  forbidden: 3,
  not_found: 2,
  pending: 1,
};

function pickBestStatus(
  current: PaymentSyncStatus,
  next: PaymentSyncStatus
): PaymentSyncStatus {
  return STATUS_PRIORITY[next] > STATUS_PRIORITY[current] ? next : current;
}

/** Poll YooKassa for one payment and reconcile provider_payments + ledger. */
export async function syncBotPurchaseFromProvider(
  botId: string,
  providerPaymentId: string,
  provider: BillingProvider = createBillingProvider(),
  deps: ReconcileProviderPaymentDeps = {}
): Promise<PaymentSyncResult> {
  const paymentId = providerPaymentId.trim();
  if (!paymentId) {
    return { status: "not_found" };
  }

  const repo = deps.providerPayments ?? new ProviderPaymentRepository();
  const row = await repo.findByProviderPaymentId(paymentId);
  if (!row) {
    return { status: "not_found" };
  }
  if (row.bot_id !== botId) {
    return { status: "forbidden" };
  }

  const event = await provider.fetchPayment(paymentId);
  if (!event) {
    return { status: "not_found" };
  }

  const status = await reconcileProviderPayment(event, {
    ...deps,
    providerPayments: repo,
  });
  return { status };
}

/** Reconcile all open provider_payments rows for a bot (pending or succeeded). */
export async function syncBotOpenProviderPayments(
  botId: string,
  provider: BillingProvider = createBillingProvider(),
  deps: ReconcileProviderPaymentDeps = {}
): Promise<PaymentSyncResult> {
  const repo = deps.providerPayments ?? new ProviderPaymentRepository();
  const open = await repo.findOpenByBotId(botId);
  if (open.length === 0) {
    return { status: "pending" };
  }

  let best: PaymentSyncStatus = "pending";
  for (const row of open) {
    const event = await provider.fetchPayment(row.provider_payment_id);
    if (!event) {
      best = pickBestStatus(best, "not_found");
      continue;
    }
    const status = await reconcileProviderPayment(event, {
      ...deps,
      providerPayments: repo,
    });
    best = pickBestStatus(best, status);
  }

  return { status: best };
}

/** Stale pending rows older than this are polled against YooKassa in the nightly task. */
export const STALE_PROVIDER_PAYMENT_MINUTES = 15;

export async function reconcileStaleProviderPayments(
  provider: BillingProvider = createBillingProvider(),
  deps: ReconcileProviderPaymentDeps = {}
): Promise<{ checked: number; applied: number }> {
  const repo = deps.providerPayments ?? new ProviderPaymentRepository();
  const cutoff = new Date(
    Date.now() - STALE_PROVIDER_PAYMENT_MINUTES * 60 * 1000
  );
  const stale = await repo.findStalePending(cutoff);

  let applied = 0;
  for (const row of stale) {
    const event = await provider.fetchPayment(row.provider_payment_id);
    if (!event) {
      continue;
    }
    const status = await reconcileProviderPayment(event, {
      ...deps,
      providerPayments: repo,
    });
    if (status === "applied") {
      applied += 1;
    }
  }

  return { checked: stale.length, applied };
}
