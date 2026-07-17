export type BillingWebhookEvent = {
  providerPaymentId: string;
  botId: string;
  purchaserUserId: string;
  credits: number;
  amountRub: number;
  status: "paid" | "refunded" | "failed" | "pending";
  packageId: string;
};

export interface BillingProvider {
  createCheckout(input: {
    botId: string;
    purchaserUserId: string;
    packageId: string;
    returnUrl: string;
    /** Charged amount; defaults to package list price when omitted. */
    amountRub?: number;
    promoCode?: string;
  }): Promise<{ checkoutUrl: string; providerPaymentId: string }>;

  verifyWebhook(
    payload: unknown,
    headers: Headers
  ): Promise<BillingWebhookEvent | null>;

  /** Load payment state from provider API (fallback when webhook was missed). */
  fetchPayment(providerPaymentId: string): Promise<BillingWebhookEvent | null>;
}
