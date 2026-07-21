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

  test("grantAdminAdjust is no-op in self-hosted mode", async () => {
    const { store, service } = createService({ DEPLOYMENT_MODE: "self-hosted" });
    await store.setBalance("bot-1", 50);
    const result = await service.grantAdminAdjust({
      botId: "bot-1",
      amount: 100,
      reason: "support",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("not_saas");
    }
    expect(await service.getBalance("bot-1")).toBe(50);
  });

  test("grantAdminAdjust writes admin_adjust ledger row", async () => {
    const { store, service } = createService();
    await store.setBalance("bot-1", 10);
    const result = await service.grantAdminAdjust({
      botId: "bot-1",
      amount: 5000,
      reason: "support ticket",
      reference: "admin-grant:test-1",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.created).toBe(true);
      expect(result.transaction.type).toBe("admin_adjust");
      expect(result.transaction.amount).toBe(5000);
      expect(result.transaction.metadata?.reason).toBe("support ticket");
      expect(result.transaction.metadata?.source).toBe("cli");
    }
    expect(await service.getBalance("bot-1")).toBe(5010);
  });

  test("grantAdminAdjust rejects deduction below zero balance", async () => {
    const { store, service } = createService();
    await store.setBalance("bot-1", 5);
    const result = await service.grantAdminAdjust({
      botId: "bot-1",
      amount: -10,
      reason: "correction",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("insufficient_balance");
    }
  });

  test("grantAdminAdjust is idempotent on reference", async () => {
    const { service } = createService();
    const first = await service.grantAdminAdjust({
      botId: "bot-1",
      amount: 100,
      reason: "once",
      reference: "admin-grant:dup",
    });
    const second = await service.grantAdminAdjust({
      botId: "bot-1",
      amount: 100,
      reason: "once",
      reference: "admin-grant:dup",
    });
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.created).toBe(false);
      expect(second.transaction.id).toBe(first.transaction.id);
    }
    expect(await service.getBalance("bot-1")).toBe(100);
  });
});
