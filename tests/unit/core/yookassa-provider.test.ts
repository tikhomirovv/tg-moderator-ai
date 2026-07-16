import { describe, expect, test } from "bun:test";
import { YooKassaBillingProvider } from "../../../server/core/billing/yookassa-provider";

const TEST_ENV = {
  YOOKASSA_SHOP_ID: "shop-test",
  YOOKASSA_SECRET_KEY: "secret-test",
  YOOKASSA_SKIP_SIGNATURE_VERIFY: "true",
};

describe("YooKassaBillingProvider", () => {
  test("verifyWebhook parses succeeded payment metadata", async () => {
    const provider = new YooKassaBillingProvider(TEST_ENV);
    const payload = {
      event: "payment.succeeded",
      object: {
        id: "pay-123",
        status: "succeeded",
        amount: { value: "490.00", currency: "RUB" },
        metadata: {
          bot_id: "mybot",
          purchaser_user_id: "user-1",
          package_id: "start",
          credits: "10000",
        },
      },
    };

    const event = await provider.verifyWebhook(payload, new Headers());
    expect(event).toEqual({
      providerPaymentId: "pay-123",
      botId: "mybot",
      purchaserUserId: "user-1",
      packageId: "start",
      credits: 10000,
      amountRub: 490,
      status: "paid",
    });
  });

  test("verifyWebhook ignores non-success events", async () => {
    const provider = new YooKassaBillingProvider(TEST_ENV);
    const event = await provider.verifyWebhook(
      { event: "payment.canceled", object: { id: "x" } },
      new Headers()
    );
    expect(event).toBeNull();
  });

  test("createCheckout calls YooKassa API", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          id: "pay-999",
          status: "pending",
          confirmation: { confirmation_url: "https://yookassa.test/pay" },
        }),
        { status: 200 }
      )) as typeof fetch;

    try {
      const provider = new YooKassaBillingProvider(TEST_ENV);
      const result = await provider.createCheckout({
        botId: "mybot",
        purchaserUserId: "user-1",
        packageId: "start",
        returnUrl: "https://app.test/bots/mybot/credits",
      });
      expect(result.checkoutUrl).toBe("https://yookassa.test/pay");
      expect(result.providerPaymentId).toBe("pay-999");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("fetchPayment maps succeeded payment from API", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string) => {
      expect(url).toContain("/payments/pay-fetch");
      return new Response(
        JSON.stringify({
          id: "pay-fetch",
          status: "succeeded",
          amount: { value: "490.00", currency: "RUB" },
          metadata: {
            bot_id: "mybot",
            purchaser_user_id: "user-1",
            package_id: "start",
            credits: "10000",
          },
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    try {
      const provider = new YooKassaBillingProvider(TEST_ENV);
      const event = await provider.fetchPayment("pay-fetch");
      expect(event?.status).toBe("paid");
      expect(event?.credits).toBe(10_000);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
