import { and, eq } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { promoCodes, promoRedemptions } from "../schema";
import type { PromoCode, PromoRedemption } from "../models/promo-code";
import { normalizePromoCode } from "../../core/billing/promo-discount";

function toPromoCode(row: typeof promoCodes.$inferSelect): PromoCode {
  return {
    id: row.id,
    code: row.code,
    discount_percent: row.discountPercent,
    is_active: row.isActive,
    expires_at: row.expiresAt,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function toPromoRedemption(
  row: typeof promoRedemptions.$inferSelect
): PromoRedemption {
  return {
    id: row.id,
    promo_code_id: row.promoCodeId,
    user_id: row.userId,
    provider_payment_id: row.providerPaymentId,
    created_at: row.createdAt,
  };
}

export class PromoCodeRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async findByCode(code: string): Promise<PromoCode | null> {
    const normalized = normalizePromoCode(code);
    const [row] = await this.db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, normalized))
      .limit(1);

    return row ? toPromoCode(row) : null;
  }

  async findById(id: number): Promise<PromoCode | null> {
    const [row] = await this.db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.id, id))
      .limit(1);

    return row ? toPromoCode(row) : null;
  }

  async create(input: {
    code: string;
    discount_percent: number;
    expires_at?: Date | null;
  }): Promise<PromoCode> {
    const now = new Date();
    const [row] = await this.db
      .insert(promoCodes)
      .values({
        code: normalizePromoCode(input.code),
        discountPercent: input.discount_percent,
        isActive: true,
        expiresAt: input.expires_at ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return toPromoCode(row);
  }
}

export class PromoRedemptionRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async findByPromoAndUser(
    promoCodeId: number,
    userId: string
  ): Promise<PromoRedemption | null> {
    const [row] = await this.db
      .select()
      .from(promoRedemptions)
      .where(
        and(
          eq(promoRedemptions.promoCodeId, promoCodeId),
          eq(promoRedemptions.userId, userId)
        )
      )
      .limit(1);

    return row ? toPromoRedemption(row) : null;
  }

  /** Idempotent insert — returns existing row on unique conflict. */
  async createIdempotent(input: {
    promo_code_id: number;
    user_id: string;
    provider_payment_id: string;
  }): Promise<PromoRedemption> {
    const [row] = await this.db
      .insert(promoRedemptions)
      .values({
        promoCodeId: input.promo_code_id,
        userId: input.user_id,
        providerPaymentId: input.provider_payment_id,
      })
      .onConflictDoNothing({
        target: [promoRedemptions.promoCodeId, promoRedemptions.userId],
      })
      .returning();

    if (row) {
      return toPromoRedemption(row);
    }

    const existing = await this.findByPromoAndUser(
      input.promo_code_id,
      input.user_id
    );
    if (!existing) {
      throw new Error("Promo redemption conflict without existing row");
    }
    return existing;
  }
}

export function isPromoCodeCurrentlyValid(
  promo: PromoCode,
  now: Date = new Date()
): boolean {
  if (!promo.is_active) {
    return false;
  }
  if (promo.expires_at && promo.expires_at <= now) {
    return false;
  }
  if (promo.discount_percent < 1 || promo.discount_percent > 100) {
    return false;
  }
  return true;
}
