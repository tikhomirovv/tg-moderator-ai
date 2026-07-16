import { describe, expect, test } from "bun:test";
import { applyCreditPurchaseFromBillingEvent } from "../../../server/core/apply-credit-purchase";
import { InMemoryCreditStore } from "../../helpers/in-memory-credit-store";
import { CreditService } from "../../../server/core/credit-service";
import type { BillingWebhookEvent } from "../../../server/core/billing-provider";

const paidEvent: BillingWebhookEvent = {
  providerPaymentId: "pay-100",
  botId: "mybot",
  purchaserUserId: "user-1",
  packageId: "start",
  credits: 10_000,
  amountRub: 490,
  status: "paid",
};

describe("applyCreditPurchaseFromBillingEvent", () => {
  test("grants credits once and ignores duplicate", async () => {
    const store = new InMemoryCreditStore();
    const creditService = new CreditService({
      env: { DEPLOYMENT_MODE: "saas" },
      store,
      ledger: store,
    });

    const first = await applyCreditPurchaseFromBillingEvent(paidEvent, {
      creditService,
      ledger: store,
    });
    const second = await applyCreditPurchaseFromBillingEvent(paidEvent, {
      creditService,
      ledger: store,
    });

    expect(first.status).toBe("applied");
    expect(second.status).toBe("duplicate");
    expect(await creditService.getBalance("mybot")).toBe(10_000);
  });
});
