import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { referrals, creditTransactions } from "../schema";
import type { Referral, ReferrerStatus } from "../models/referral";

function toReferral(row: typeof referrals.$inferSelect): Referral {
  return {
    id: row.id,
    referrer_user_id: row.referrerUserId,
    referee_user_id: row.refereeUserId,
    provider_payment_id: row.providerPaymentId,
    base_credits: row.baseCredits,
    referee_bonus_credits: row.refereeBonusCredits,
    referrer_bonus_credits: row.referrerBonusCredits,
    referee_bot_id: row.refereeBotId,
    referrer_status: row.referrerStatus,
    referrer_claimed_bot_id: row.referrerClaimedBotId,
    referral_code: row.referralCode,
    created_at: row.createdAt,
    claimed_at: row.claimedAt,
  };
}

export class ReferralRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async findByProviderPaymentId(
    providerPaymentId: string
  ): Promise<Referral | null> {
    const [row] = await this.db
      .select()
      .from(referrals)
      .where(eq(referrals.providerPaymentId, providerPaymentId))
      .limit(1);
    return row ? toReferral(row) : null;
  }

  async findByRefereeUserId(refereeUserId: string): Promise<Referral | null> {
    const [row] = await this.db
      .select()
      .from(referrals)
      .where(eq(referrals.refereeUserId, refereeUserId))
      .limit(1);
    return row ? toReferral(row) : null;
  }

  async listPendingByReferrerUserId(referrerUserId: string): Promise<Referral[]> {
    const rows = await this.db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerUserId, referrerUserId),
          eq(referrals.referrerStatus, "pending")
        )
      )
      .orderBy(referrals.createdAt);

    return rows.map(toReferral);
  }

  async create(input: {
    referrer_user_id: string;
    referee_user_id: string;
    provider_payment_id: string;
    base_credits: number;
    referee_bonus_credits: number;
    referrer_bonus_credits: number;
    referee_bot_id: string;
    referrer_status: ReferrerStatus;
    referral_code?: string | null;
  }): Promise<Referral> {
    const [row] = await this.db
      .insert(referrals)
      .values({
        referrerUserId: input.referrer_user_id,
        refereeUserId: input.referee_user_id,
        providerPaymentId: input.provider_payment_id,
        baseCredits: input.base_credits,
        refereeBonusCredits: input.referee_bonus_credits,
        referrerBonusCredits: input.referrer_bonus_credits,
        refereeBotId: input.referee_bot_id,
        referrerStatus: input.referrer_status,
        referralCode: input.referral_code ?? null,
      })
      .returning();

    return toReferral(row);
  }

  async markReferrerClaimed(
    referralIds: number[],
    botId: string
  ): Promise<void> {
    if (referralIds.length === 0) {
      return;
    }

    const now = new Date();
    await this.db
      .update(referrals)
      .set({
        referrerStatus: "claimed",
        referrerClaimedBotId: botId,
        claimedAt: now,
      })
      .where(
        and(
          inArray(referrals.id, referralIds),
          eq(referrals.referrerStatus, "pending")
        )
      );
  }

  async countPriorPurchasesForUser(
    userId: string,
    excludeProviderPaymentId: string
  ): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(creditTransactions)
      .where(
        and(
          eq(creditTransactions.type, "purchase"),
          eq(creditTransactions.actorUserId, userId),
          ne(creditTransactions.reference, excludeProviderPaymentId)
        )
      );

    return row?.count ?? 0;
  }
}
