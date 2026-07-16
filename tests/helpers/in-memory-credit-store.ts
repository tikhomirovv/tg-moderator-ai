import type { CreditTransaction } from "../../server/database/models/credit-transaction";
import type { CreditLedger, CreditStore } from "../../server/core/credit-service";

type LedgerRow = CreditTransaction;

export class InMemoryCreditStore implements CreditStore, CreditLedger {
  private balances = new Map<string, number>();
  private ledger: LedgerRow[] = [];
  private nextId = 1;

  async getCreditBalance(botId: string): Promise<number> {
    return this.balances.get(botId) ?? 0;
  }

  async setBalance(botId: string, balance: number): Promise<void> {
    this.balances.set(botId, balance);
  }

  async conditionalDebit(botId: string): Promise<number | null> {
    const current = this.balances.get(botId) ?? 0;
    if (current < 1) {
      return null;
    }
    const next = current - 1;
    this.balances.set(botId, next);
    return next;
  }

  async applyDelta(botId: string, amount: number): Promise<number> {
    const next = (this.balances.get(botId) ?? 0) + amount;
    this.balances.set(botId, next);
    return next;
  }

  async create(
    input: Omit<LedgerRow, "id" | "created_at">
  ): Promise<LedgerRow> {
    return this.insertLedgerRow(input);
  }

  async insertLedgerRow(
    input: Omit<LedgerRow, "id" | "created_at">
  ): Promise<LedgerRow> {
    const row: LedgerRow = {
      ...input,
      id: this.nextId++,
      created_at: new Date(),
    };
    this.ledger.push(row);
    return row;
  }

  async findDebitModeration(
    botId: string,
    chatId: number,
    messageId: number
  ): Promise<LedgerRow | null> {
    return (
      this.ledger.find(
        (row) =>
          row.bot_id === botId &&
          row.type === "debit_moderation" &&
          row.chat_id === chatId &&
          row.reference === String(messageId)
      ) ?? null
    );
  }

  async findPurchaseByProviderPaymentId(
    paymentId: string
  ): Promise<LedgerRow | null> {
    return (
      this.ledger.find(
        (row) => row.type === "purchase" && row.reference === paymentId
      ) ?? null
    );
  }

  async sumAmountByBot(botId: string): Promise<number> {
    return this.ledger
      .filter((row) => row.bot_id === botId)
      .reduce((sum, row) => sum + row.amount, 0);
  }
}
