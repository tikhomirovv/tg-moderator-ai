export type BillingWebhookEvent = {
  providerPaymentId: string;
  botId: string;
  purchaserUserId: string;
  credits: number;
  amountRub: number;
  status: "paid" | "refunded" | "failed";
  packageId: string;
};

export interface BillingProvider {
  createCheckout(input: {
    botId: string;
    purchaserUserId: string;
    packageId: string;
    returnUrl: string;
  }): Promise<{ checkoutUrl: string; providerPaymentId: string }>;

  verifyWebhook(
    payload: unknown,
    headers: Headers
  ): Promise<BillingWebhookEvent | null>;
}
