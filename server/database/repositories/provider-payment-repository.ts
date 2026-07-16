import { and, eq, inArray, lt } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { providerPayments } from "../schema";
import type {
  CreateProviderPaymentInput,
  ProviderPayment,
  ProviderPaymentStatus,
} from "../models/provider-payment";

function toProviderPayment(
  row: typeof providerPayments.$inferSelect
): ProviderPayment {
  return {
    id: row.id,
    provider_payment_id: row.providerPaymentId,
    bot_id: row.botId,
    package_id: row.packageId,
    amount_rub: row.amountRub,
    credits: row.credits,
    status: row.status,
    purchaser_user_id: row.purchaserUserId,
    credited_at: row.creditedAt,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export class ProviderPaymentRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async createPending(
    input: CreateProviderPaymentInput
  ): Promise<ProviderPayment> {
    const now = new Date();
    const [row] = await this.db
      .insert(providerPayments)
      .values({
        providerPaymentId: input.provider_payment_id,
        botId: input.bot_id,
        packageId: input.package_id,
        amountRub: input.amount_rub,
        credits: input.credits,
        status: "pending",
        purchaserUserId: input.purchaser_user_id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return toProviderPayment(row);
  }

  async findByProviderPaymentId(
    providerPaymentId: string
  ): Promise<ProviderPayment | null> {
    const [row] = await this.db
      .select()
      .from(providerPayments)
      .where(eq(providerPayments.providerPaymentId, providerPaymentId))
      .limit(1);

    return row ? toProviderPayment(row) : null;
  }

  async findOpenByBotId(botId: string): Promise<ProviderPayment[]> {
    const rows = await this.db
      .select()
      .from(providerPayments)
      .where(
        and(
          eq(providerPayments.botId, botId),
          inArray(providerPayments.status, ["pending", "succeeded"])
        )
      )
      .orderBy(providerPayments.createdAt);

    return rows.map(toProviderPayment);
  }

  async findStalePending(olderThan: Date): Promise<ProviderPayment[]> {
    const rows = await this.db
      .select()
      .from(providerPayments)
      .where(
        and(
          eq(providerPayments.status, "pending"),
          lt(providerPayments.createdAt, olderThan)
        )
      )
      .orderBy(providerPayments.createdAt);

    return rows.map(toProviderPayment);
  }

  async updateStatus(
    providerPaymentId: string,
    status: ProviderPaymentStatus
  ): Promise<ProviderPayment | null> {
    const [row] = await this.db
      .update(providerPayments)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(providerPayments.providerPaymentId, providerPaymentId))
      .returning();

    return row ? toProviderPayment(row) : null;
  }

  async markCredited(providerPaymentId: string): Promise<ProviderPayment | null> {
    const now = new Date();
    const [row] = await this.db
      .update(providerPayments)
      .set({
        status: "credited",
        creditedAt: now,
        updatedAt: now,
      })
      .where(eq(providerPayments.providerPaymentId, providerPaymentId))
      .returning();

    return row ? toProviderPayment(row) : null;
  }
}
