import { describe, expect, test } from "bun:test";
import { reconcileProviderPayment } from "../../../server/core/provider-payment-reconciliation";
import { InMemoryCreditStore } from "../../helpers/in-memory-credit-store";
import { CreditService } from "../../../server/core/credit-service";
import type { BillingWebhookEvent } from "../../../server/core/billing-provider";
import type { ProviderPayment } from "../../../server/database/models/provider-payment";

const paidEvent: BillingWebhookEvent = {
  providerPaymentId: "pay-promo-1",
  botId: "mybot",
  purchaserUserId: "user-1",
  packageId: "start",
  credits: 10_000,
  amountRub: 441,
  status: "paid",
};

function createPaymentRow(
  overrides: Partial<ProviderPayment> = {}
): ProviderPayment {
  return {
    id: 1,
    provider_payment_id: "pay-promo-1",
    bot_id: "mybot",
    package_id: "start",
    amount_rub: 441,
    credits: 10_000,
    status: "pending",
    purchaser_user_id: "user-1",
    promo_code_id: 7,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe("reconcileProviderPayment promo redemption", () => {
  test("records redemption after successful paid checkout with promo", async () => {
    const store = new InMemoryCreditStore();
    const creditService = new CreditService({
      env: { DEPLOYMENT_MODE: "saas" },
      store,
      ledger: store,
    });

    let paymentRow = createPaymentRow();
    const redemptions: Array<{
      promo_code_id: number;
      user_id: string;
      provider_payment_id: string;
    }> = [];

    const providerPayments = {
      async findByProviderPaymentId() {
        return paymentRow;
      },
      async updateStatus(_id: string, status: ProviderPayment["status"]) {
        paymentRow = { ...paymentRow, status };
        return paymentRow;
      },
      async markCredited() {
        paymentRow = { ...paymentRow, status: "credited" };
        return paymentRow;
      },
    };

    const promoCodes = {
      async findById(id: number) {
        expect(id).toBe(7);
        return {
          id: 7,
          code: "SAVE10",
          discount_percent: 10,
          is_active: true,
          expires_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
      },
    };

    const promoRedemptions = {
      async createIdempotent(input: {
        promo_code_id: number;
        user_id: string;
        provider_payment_id: string;
      }) {
        redemptions.push(input);
        return { id: 1, ...input, created_at: new Date() };
      },
    };

    const status = await reconcileProviderPayment(paidEvent, {
      creditService,
      ledger: store,
      providerPayments: providerPayments as never,
      promoCodes: promoCodes as never,
      promoRedemptions: promoRedemptions as never,
    });

    expect(status).toBe("applied");
    expect(redemptions).toEqual([
      {
        promo_code_id: 7,
        user_id: "user-1",
        provider_payment_id: "pay-promo-1",
      },
    ]);

    const purchase = await store.findPurchaseByProviderPaymentId("pay-promo-1");
    expect(purchase?.metadata?.promo_code).toBe("SAVE10");
    expect(purchase?.metadata?.original_amount_rub).toBe(490);
    expect(purchase?.metadata?.amount_rub).toBe(441);
    expect(await creditService.getBalance("mybot")).toBe(10_000);
  });
});
