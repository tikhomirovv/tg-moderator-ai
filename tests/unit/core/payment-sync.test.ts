import { describe, expect, test } from "bun:test";
import type {
  BillingProvider,
  BillingWebhookEvent,
} from "../../../server/core/billing-provider";
import { applyCreditPurchaseFromBillingEvent } from "../../../server/core/apply-credit-purchase";
import {
  reconcileProviderPayment,
  mapBillingEventToProviderStatus,
} from "../../../server/core/provider-payment-reconciliation";
import {
  syncBotOpenProviderPayments,
  syncBotPurchaseFromProvider,
} from "../../../server/core/payment-sync";
import { InMemoryCreditStore } from "../../helpers/in-memory-credit-store";
import { InMemoryProviderPaymentStore } from "../../helpers/in-memory-provider-payment-store";
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
  const providerPayments = new InMemoryProviderPaymentStore();
  const creditService = new CreditService({
    env: { DEPLOYMENT_MODE: "saas" },
    store,
    ledger: store,
  });
  return { store, creditService, providerPayments };
}

const paidEvent: BillingWebhookEvent = {
  providerPaymentId: "pay-sync",
  botId: "mybot",
  purchaserUserId: "user-1",
  packageId: "start",
  credits: 10_000,
  amountRub: 490,
  status: "paid",
};

describe("mapBillingEventToProviderStatus", () => {
  test("maps paid to succeeded", () => {
    expect(mapBillingEventToProviderStatus({ ...paidEvent, status: "paid" })).toBe(
      "succeeded"
    );
  });

  test("maps pending to pending", () => {
    expect(
      mapBillingEventToProviderStatus({ ...paidEvent, status: "pending" })
    ).toBe("pending");
  });
});

describe("reconcileProviderPayment", () => {
  test("grants credits and marks row credited on paid event", async () => {
    const { store, creditService, providerPayments } = createSaasCreditDeps();
    await providerPayments.createPending({
      provider_payment_id: paidEvent.providerPaymentId,
      bot_id: paidEvent.botId,
      package_id: paidEvent.packageId,
      amount_rub: paidEvent.amountRub,
      credits: paidEvent.credits,
      purchaser_user_id: paidEvent.purchaserUserId,
    });

    const status = await reconcileProviderPayment(paidEvent, {
      creditService,
      ledger: store,
      providerPayments,
    });

    expect(status).toBe("applied");
    expect(await creditService.getBalance("mybot")).toBe(10_000);
    const row = await providerPayments.findByProviderPaymentId("pay-sync");
    expect(row?.status).toBe("credited");
  });
});

describe("syncBotPurchaseFromProvider", () => {
  test("applies credits when provider reports paid and webhook missed", async () => {
    const provider = new MockBillingProvider();
    provider.setPayment(paidEvent);

    const { store, creditService, providerPayments } = createSaasCreditDeps();
    await providerPayments.createPending({
      provider_payment_id: paidEvent.providerPaymentId,
      bot_id: paidEvent.botId,
      package_id: paidEvent.packageId,
      amount_rub: paidEvent.amountRub,
      credits: paidEvent.credits,
      purchaser_user_id: paidEvent.purchaserUserId,
    });

    const result = await syncBotPurchaseFromProvider(
      "mybot",
      "pay-sync",
      provider,
      { creditService, ledger: store, providerPayments }
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

    const { store, creditService, providerPayments } = createSaasCreditDeps();
    await providerPayments.createPending({
      provider_payment_id: event.providerPaymentId,
      bot_id: event.botId,
      package_id: event.packageId,
      amount_rub: event.amountRub,
      credits: event.credits,
      purchaser_user_id: event.purchaserUserId,
    });
    await applyCreditPurchaseFromBillingEvent(event, {
      creditService,
      ledger: store,
      providerPayments,
    });

    const result = await syncBotPurchaseFromProvider(
      "mybot",
      "pay-dup",
      provider,
      { creditService, ledger: store, providerPayments }
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
      status: "pending",
    });

    const { providerPayments } = createSaasCreditDeps();
    await providerPayments.createPending({
      provider_payment_id: "pay-wait",
      bot_id: "mybot",
      package_id: "start",
      amount_rub: 490,
      credits: 10_000,
      purchaser_user_id: "user-1",
    });

    const result = await syncBotPurchaseFromProvider(
      "mybot",
      "pay-wait",
      provider,
      { providerPayments }
    );
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

    const { providerPayments } = createSaasCreditDeps();
    await providerPayments.createPending({
      provider_payment_id: "pay-other",
      bot_id: "mybot",
      package_id: "start",
      amount_rub: 490,
      credits: 10_000,
      purchaser_user_id: "user-1",
    });

    const result = await syncBotPurchaseFromProvider(
      "mybot",
      "pay-other",
      provider,
      { providerPayments }
    );
    expect(result.status).toBe("forbidden");
  });

  test("returns not_found when provider payment row is missing", async () => {
    const provider = new MockBillingProvider();
    provider.setPayment(paidEvent);

    const { providerPayments } = createSaasCreditDeps();
    const result = await syncBotPurchaseFromProvider("mybot", "pay-sync", provider, {
      providerPayments,
    });
    expect(result.status).toBe("not_found");
  });
});

describe("syncBotOpenProviderPayments", () => {
  test("reconciles all open rows for bot", async () => {
    const provider = new MockBillingProvider();
    provider.setPayment(paidEvent);

    const { creditService, providerPayments, store } = createSaasCreditDeps();
    await providerPayments.createPending({
      provider_payment_id: paidEvent.providerPaymentId,
      bot_id: paidEvent.botId,
      package_id: paidEvent.packageId,
      amount_rub: paidEvent.amountRub,
      credits: paidEvent.credits,
      purchaser_user_id: paidEvent.purchaserUserId,
    });

    const result = await syncBotOpenProviderPayments("mybot", provider, {
      creditService,
      ledger: store,
      providerPayments,
    });

    expect(result.status).toBe("applied");
    expect(await creditService.getBalance("mybot")).toBe(10_000);
  });
});
