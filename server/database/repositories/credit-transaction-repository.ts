import { and, eq, sql } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { creditTransactions } from "../schema";
import type {
  CreateCreditTransactionInput,
  CreditTransaction,
} from "../models/credit-transaction";

function toCreditTransaction(
  row: typeof creditTransactions.$inferSelect
): CreditTransaction {
  return {
    id: row.id,
    bot_id: row.botId,
    type: row.type,
    amount: row.amount,
    balance_after: row.balanceAfter,
    chat_id: row.chatId,
    reference: row.reference,
    actor_user_id: row.actorUserId,
    metadata: row.metadata ?? null,
    created_at: row.createdAt,
  };
}

export class CreditTransactionRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async create(input: CreateCreditTransactionInput): Promise<CreditTransaction> {
    const [row] = await this.db
      .insert(creditTransactions)
      .values({
        botId: input.bot_id,
        type: input.type,
        amount: input.amount,
        balanceAfter: input.balance_after,
        chatId: input.chat_id ?? null,
        reference: input.reference ?? null,
        actorUserId: input.actor_user_id ?? null,
        metadata: input.metadata ?? null,
      })
      .returning();

    return toCreditTransaction(row);
  }

  async findDebitModeration(
    botId: string,
    chatId: number,
    messageId: number
  ): Promise<CreditTransaction | null> {
    const reference = String(messageId);
    const [row] = await this.db
      .select()
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.botId, botId),
          eq(creditTransactions.type, "debit_moderation"),
          eq(creditTransactions.chatId, chatId),
          eq(creditTransactions.reference, reference)
        )
      )
      .limit(1);

    return row ? toCreditTransaction(row) : null;
  }

  async findPurchaseByProviderPaymentId(
    providerPaymentId: string
  ): Promise<CreditTransaction | null> {
    const [row] = await this.db
      .select()
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.type, "purchase"),
          eq(creditTransactions.reference, providerPaymentId)
        )
      )
      .limit(1);

    return row ? toCreditTransaction(row) : null;
  }

  async findByReferenceAndType(
    reference: string,
    type: CreditTransaction["type"]
  ): Promise<CreditTransaction | null> {
    const [row] = await this.db
      .select()
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.reference, reference),
          eq(creditTransactions.type, type)
        )
      )
      .limit(1);

    return row ? toCreditTransaction(row) : null;
  }

  async sumAmountByBot(botId: string): Promise<number> {
    const [row] = await this.db
      .select({
        total: sql<number>`coalesce(sum(${creditTransactions.amount}), 0)::int`,
      })
      .from(creditTransactions)
      .where(eq(creditTransactions.botId, botId));

    return row?.total ?? 0;
  }
}
