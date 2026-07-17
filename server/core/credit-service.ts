import { eq, sql, and } from "drizzle-orm";
import { isSaasMode } from "./deployment-mode";
import { logger } from "./logger";
import { SIGNUP_CREDIT_GRANT } from "./credit-packages";
import { BotRepository } from "../database/repositories/bot-repository";
import { CreditTransactionRepository } from "../database/repositories/credit-transaction-repository";
import { bots } from "../database/schema";
import { getDatabaseConnection } from "../database/connection";
import type { CreditTransaction } from "../database/models/credit-transaction";

export type DebitModerationInput = {
  botId: string;
  chatId: number;
  messageId: number;
};

export type CreditStore = {
  getCreditBalance(botId: string): Promise<number>;
  conditionalDebit(botId: string): Promise<number | null>;
  applyDelta(botId: string, amount: number): Promise<number>;
};

export type CreditLedger = {
  create(input: {
    bot_id: string;
    type: CreditTransaction["type"];
    amount: number;
    balance_after: number;
    chat_id?: number | null;
    reference?: string | null;
    actor_user_id?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<CreditTransaction>;
  findDebitModeration(
    botId: string,
    chatId: number,
    messageId: number
  ): Promise<CreditTransaction | null>;
  findPurchaseByProviderPaymentId(
    paymentId: string
  ): Promise<CreditTransaction | null>;
  sumAmountByBot(botId: string): Promise<number>;
};

class DrizzleCreditStore implements CreditStore {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async getCreditBalance(botId: string): Promise<number> {
    const botRepo = new BotRepository();
    return botRepo.getCreditBalance(botId);
  }

  async conditionalDebit(botId: string): Promise<number | null> {
    const updated = await this.db
      .update(bots)
      .set({
        creditBalance: sql`${bots.creditBalance} - 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(bots.id, botId), sql`${bots.creditBalance} >= 1`))
      .returning({ creditBalance: bots.creditBalance });

    return updated[0]?.creditBalance ?? null;
  }

  async applyDelta(botId: string, amount: number): Promise<number> {
    const updated = await this.db
      .update(bots)
      .set({
        creditBalance: sql`${bots.creditBalance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(bots.id, botId))
      .returning({ creditBalance: bots.creditBalance });

    if (updated.length === 0) {
      throw new Error(`Bot not found: ${botId}`);
    }

    return updated[0]!.creditBalance;
  }
}

type CreditServiceOptions = {
  env?: NodeJS.ProcessEnv;
  store?: CreditStore;
  ledger?: CreditLedger;
};

export class CreditService {
  private env: NodeJS.ProcessEnv;
  private store: CreditStore;
  private ledger: CreditLedger;

  constructor(options: CreditServiceOptions = {}) {
    this.env = options.env ?? process.env;
    this.store = options.store ?? new DrizzleCreditStore();
    this.ledger = options.ledger ?? new CreditTransactionRepository();
  }

  isBillingEnabled(): boolean {
    return isSaasMode(this.env);
  }

  async getBalance(botId: string): Promise<number> {
    return this.store.getCreditBalance(botId);
  }

  async grantSignupCredits(botId: string): Promise<CreditTransaction | null> {
    if (!this.isBillingEnabled()) {
      return null;
    }

    return this.applyCreditDelta({
      botId,
      amount: SIGNUP_CREDIT_GRANT,
      type: "grant_signup",
      reference: "signup",
      metadata: { reason: "new_bot" },
    });
  }

  async grantPurchase(input: {
    botId: string;
    credits: number;
    actorUserId: string;
    providerPaymentId: string;
    packageId: string;
    amountRub: number;
    originalAmountRub?: number;
    promoCode?: string;
  }): Promise<CreditTransaction> {
    const metadata: Record<string, unknown> = {
      package_id: input.packageId,
      amount_rub: input.amountRub,
      provider_payment_id: input.providerPaymentId,
    };
    if (
      input.originalAmountRub !== undefined &&
      input.originalAmountRub !== input.amountRub
    ) {
      metadata.original_amount_rub = input.originalAmountRub;
    }
    if (input.promoCode) {
      metadata.promo_code = input.promoCode;
    }

    return this.applyCreditDelta({
      botId: input.botId,
      amount: input.credits,
      type: "purchase",
      actorUserId: input.actorUserId,
      reference: input.providerPaymentId,
      metadata,
    });
  }

  async debitModeration(
    input: DebitModerationInput
  ): Promise<CreditTransaction | null> {
    if (!this.isBillingEnabled()) {
      return null;
    }

    const existing = await this.ledger.findDebitModeration(
      input.botId,
      input.chatId,
      input.messageId
    );
    if (existing) {
      return existing;
    }

    const balanceAfter = await this.store.conditionalDebit(input.botId);
    if (balanceAfter === null) {
      logger.warn(
        { botId: input.botId, chatId: input.chatId, messageId: input.messageId },
        "Skipped moderation debit — insufficient credits"
      );
      return null;
    }

    const reference = String(input.messageId);

    try {
      return await this.ledger.create({
        bot_id: input.botId,
        type: "debit_moderation",
        amount: -1,
        balance_after: balanceAfter,
        chat_id: input.chatId,
        reference,
        metadata: { message_id: input.messageId },
      });
    } catch (error) {
      await this.store.applyDelta(input.botId, 1);

      const raced = await this.ledger.findDebitModeration(
        input.botId,
        input.chatId,
        input.messageId
      );
      if (raced) {
        return raced;
      }
      throw error;
    }
  }

  async reconcileBot(botId: string): Promise<{
    actual: number;
    expected: number;
    fixed: boolean;
  }> {
    const actual = await this.getBalance(botId);
    const expected = await this.ledger.sumAmountByBot(botId);

    if (actual === expected) {
      return { actual, expected, fixed: false };
    }

    logger.error(
      { botId, actual, expected },
      "Credit balance mismatch — applying reconcile_fix"
    );

    const delta = expected - actual;
    await this.applyCreditDelta({
      botId,
      amount: delta,
      type: "reconcile_fix",
      reference: `reconcile:${Date.now()}`,
      metadata: { previous_balance: actual, ledger_sum: expected },
    });

    return { actual, expected, fixed: true };
  }

  private async applyCreditDelta(input: {
    botId: string;
    amount: number;
    type: CreditTransaction["type"];
    reference?: string;
    actorUserId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<CreditTransaction> {
    const balanceAfter = await this.store.applyDelta(input.botId, input.amount);

    return this.ledger.create({
      bot_id: input.botId,
      type: input.type,
      amount: input.amount,
      balance_after: balanceAfter,
      reference: input.reference,
      actor_user_id: input.actorUserId,
      metadata: input.metadata,
    });
  }
}
