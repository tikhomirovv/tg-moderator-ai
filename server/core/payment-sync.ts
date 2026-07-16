import type { BillingProvider } from "./billing-provider";
import { applyCreditPurchaseFromBillingEvent } from "./apply-credit-purchase";
import { createBillingProvider } from "./billing/yookassa-provider";

export type PaymentSyncStatus =
  | "applied"
  | "duplicate"
  | "pending"
  | "not_found"
  | "forbidden";

export type PaymentSyncResult = {
  status: PaymentSyncStatus;
};

/** Poll YooKassa for payment status and grant credits if succeeded but webhook missed. */
export async function syncBotPurchaseFromProvider(
  botId: string,
  providerPaymentId: string,
  provider: BillingProvider = createBillingProvider(),
  applyDeps?: Parameters<typeof applyCreditPurchaseFromBillingEvent>[1]
): Promise<PaymentSyncResult> {
  const paymentId = providerPaymentId.trim();
  if (!paymentId) {
    return { status: "not_found" };
  }

  const event = await provider.fetchPayment(paymentId);
  if (!event) {
    return { status: "not_found" };
  }

  if (event.botId !== botId) {
    return { status: "forbidden" };
  }

  if (event.status !== "paid") {
    return { status: "pending" };
  }

  const result = await applyCreditPurchaseFromBillingEvent(event, applyDeps);
  if (result.status === "applied") {
    return { status: "applied" };
  }
  if (result.status === "duplicate") {
    return { status: "duplicate" };
  }

  return { status: "pending" };
}
