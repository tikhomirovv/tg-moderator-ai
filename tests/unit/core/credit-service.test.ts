import { describe, expect, test, beforeEach } from "bun:test";
import { InMemoryCreditStore } from "../../helpers/in-memory-credit-store";
import { CreditService } from "../../../server/core/credit-service";
import { resetDeploymentModeCacheForTests } from "../../../server/core/deployment-mode";

function createService(env: NodeJS.ProcessEnv = { DEPLOYMENT_MODE: "saas" }) {
  resetDeploymentModeCacheForTests();
  const store = new InMemoryCreditStore();
  const service = new CreditService({
    env,
    store,
    ledger: store,
  });
  return { store, service };
}

describe("CreditService", () => {
  beforeEach(() => {
    resetDeploymentModeCacheForTests();
  });
  test("grant signup credits in saas mode", async () => {
    const { service } = createService();
    const tx = await service.grantSignupCredits("bot-1");
    expect(tx?.amount).toBe(100);
    expect(await service.getBalance("bot-1")).toBe(100);
  });

  test("debit moderation is no-op in self-hosted mode", async () => {
    const { store, service } = createService({ DEPLOYMENT_MODE: "self-hosted" });
    await store.setBalance("bot-1", 5);
    const tx = await service.debitModeration({
      botId: "bot-1",
      chatId: -100,
      messageId: 42,
    });
    expect(tx).toBeNull();
    expect(await service.getBalance("bot-1")).toBe(5);
  });

  test("conditional debit prevents negative balance", async () => {
    const { store, service } = createService();
    await store.setBalance("bot-1", 0);
    const tx = await service.debitModeration({
      botId: "bot-1",
      chatId: -100,
      messageId: 1,
    });
    expect(tx).toBeNull();
    expect(await service.getBalance("bot-1")).toBe(0);
  });

  test("idempotent debit per message", async () => {
    const { store, service } = createService();
    await store.setBalance("bot-1", 5);
    const first = await service.debitModeration({
      botId: "bot-1",
      chatId: -100,
      messageId: 99,
    });
    const second = await service.debitModeration({
      botId: "bot-1",
      chatId: -100,
      messageId: 99,
    });

    expect(first?.id).toBeDefined();
    expect(second?.id).toBe(first?.id);
    expect(await service.getBalance("bot-1")).toBe(4);
  });

  test("reconcile fixes mismatch", async () => {
    const { store, service } = createService();
    await store.setBalance("bot-1", 10);
    await store.insertLedgerRow({
      bot_id: "bot-1",
      type: "grant_signup",
      amount: 100,
      balance_after: 100,
    });

    const result = await service.reconcileBot("bot-1");
    expect(result.fixed).toBe(true);
    expect(await service.getBalance("bot-1")).toBe(100);
  });
});
