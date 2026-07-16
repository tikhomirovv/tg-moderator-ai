import { describe, expect, test } from "bun:test";
import type {
  BillingProvider,
  BillingWebhookEvent,
} from "../../../server/core/billing-provider";
import { applyCreditPurchaseFromBillingEvent } from "../../../server/core/apply-credit-purchase";
import { syncBotPurchaseFromProvider } from "../../../server/core/payment-sync";
import { InMemoryCreditStore } from "../../helpers/in-memory-credit-store";
import { CreditService } from "../../../server/core/credit-service";

class MockBillingProvider implements BillingProvider {
  constructor(private payments = new Map<string, BillingWebhookEvent>()) {}

  setPayment(event: BillingWebhookEvent) {
    this.payments.set(event.providerPaymentId, event);
  }

  async createCheckout() {
    throw new Error("not used");
  }

  async verifyWebhook() {
    return null;
  }

  async fetchPayment(providerPaymentId: string) {
    return this.payments.get(providerPaymentId) ?? null;
  }
}

function createSaasCreditDeps() {
  const store = new InMemoryCreditStore();
  const creditService = new CreditService({
    env: { DEPLOYMENT_MODE: "saas" },
    store,
    ledger: store,
  });
  return { store, creditService };
}

describe("syncBotPurchaseFromProvider", () => {
  test("applies credits when provider reports paid and webhook missed", async () => {
    const provider = new MockBillingProvider();
    provider.setPayment({
      providerPaymentId: "pay-sync",
      botId: "mybot",
      purchaserUserId: "user-1",
      packageId: "start",
      credits: 10_000,
      amountRub: 490,
      status: "paid",
    });

    const { store, creditService } = createSaasCreditDeps();
    const result = await syncBotPurchaseFromProvider(
      "mybot",
      "pay-sync",
      provider,
      { creditService, ledger: store }
    );

    expect(result.status).toBe("applied");
    expect(await creditService.getBalance("mybot")).toBe(10_000);
  });

  test("returns duplicate when purchase already in ledger", async () => {
    const provider = new MockBillingProvider();
    const event: BillingWebhookEvent = {
      providerPaymentId: "pay-dup",
      botId: "mybot",
      purchaserUserId: "user-1",
      packageId: "start",
      credits: 10_000,
      amountRub: 490,
      status: "paid",
    };
    provider.setPayment(event);

    const { store, creditService } = createSaasCreditDeps();
    await applyCreditPurchaseFromBillingEvent(event, {
      creditService,
      ledger: store,
    });

    const result = await syncBotPurchaseFromProvider(
      "mybot",
      "pay-dup",
      provider,
      { creditService, ledger: store }
    );
    expect(result.status).toBe("duplicate");
  });

  test("returns pending for unpaid provider status", async () => {
    const provider = new MockBillingProvider();
    provider.setPayment({
      providerPaymentId: "pay-wait",
      botId: "mybot",
      purchaserUserId: "user-1",
      packageId: "start",
      credits: 10_000,
      amountRub: 490,
      status: "failed",
    });

    const result = await syncBotPurchaseFromProvider("mybot", "pay-wait", provider);
    expect(result.status).toBe("pending");
  });

  test("returns forbidden when payment metadata targets another bot", async () => {
    const provider = new MockBillingProvider();
    provider.setPayment({
      providerPaymentId: "pay-other",
      botId: "other-bot",
      purchaserUserId: "user-1",
      packageId: "start",
      credits: 10_000,
      amountRub: 490,
      status: "paid",
    });

    const result = await syncBotPurchaseFromProvider("mybot", "pay-other", provider);
    expect(result.status).toBe("forbidden");
  });
});
