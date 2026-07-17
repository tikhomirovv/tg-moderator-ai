import { isSaasMode } from "./deployment-mode";
import {
  computeDiscountedAmountRub,
  normalizePromoCode,
} from "./billing/promo-discount";
import type { PromoCode } from "../database/models/promo-code";
import {
  isPromoCodeCurrentlyValid,
  PromoCodeRepository,
  PromoRedemptionRepository,
} from "../database/repositories/promo-code-repository";

export type PromoValidationError =
  | "not_saas"
  | "empty_code"
  | "not_found"
  | "inactive"
  | "expired"
  | "already_redeemed";

export type ValidatedPromo = {
  promo: PromoCode;
  discount_percent: number;
};

export type PromoValidationResult =
  | { ok: true; value: ValidatedPromo }
  | { ok: false; error: PromoValidationError };

export type PromoStore = {
  findPromoByCode(code: string): Promise<PromoCode | null>;
  findRedemption(
    promoCodeId: number,
    userId: string
  ): Promise<{ id: number } | null>;
};

class DrizzlePromoStore implements PromoStore {
  private codes = new PromoCodeRepository();
  private redemptions = new PromoRedemptionRepository();

  async findPromoByCode(code: string): Promise<PromoCode | null> {
    return this.codes.findByCode(code);
  }

  async findRedemption(
    promoCodeId: number,
    userId: string
  ): Promise<{ id: number } | null> {
    const row = await this.redemptions.findByPromoAndUser(promoCodeId, userId);
    return row ? { id: row.id } : null;
  }
}

type PromoServiceOptions = {
  env?: NodeJS.ProcessEnv;
  store?: PromoStore;
  now?: () => Date;
};

export class PromoService {
  private env: NodeJS.ProcessEnv;
  private store: PromoStore;
  private now: () => Date;

  constructor(options: PromoServiceOptions = {}) {
    this.env = options.env ?? process.env;
    this.store = options.store ?? new DrizzlePromoStore();
    this.now = options.now ?? (() => new Date());
  }

  isEnabled(): boolean {
    return isSaasMode(this.env);
  }

  async validateForUser(
    rawCode: string,
    userId: string
  ): Promise<PromoValidationResult> {
    if (!this.isEnabled()) {
      return { ok: false, error: "not_saas" };
    }

    const code = normalizePromoCode(rawCode);
    if (!code) {
      return { ok: false, error: "empty_code" };
    }

    const promo = await this.store.findPromoByCode(code);
    if (!promo) {
      return { ok: false, error: "not_found" };
    }

    if (!promo.is_active) {
      return { ok: false, error: "inactive" };
    }

    if (!isPromoCodeCurrentlyValid(promo, this.now())) {
      if (promo.expires_at && promo.expires_at <= this.now()) {
        return { ok: false, error: "expired" };
      }
      return { ok: false, error: "inactive" };
    }

    const redeemed = await this.store.findRedemption(promo.id, userId);
    if (redeemed) {
      return { ok: false, error: "already_redeemed" };
    }

    return {
      ok: true,
      value: {
        promo,
        discount_percent: promo.discount_percent,
      },
    };
  }

  computeDiscountedPrice(
    originalAmountRub: number,
    discountPercent: number
  ): number {
    return computeDiscountedAmountRub(originalAmountRub, discountPercent);
  }
}

export function promoValidationErrorMessage(error: PromoValidationError): string {
  switch (error) {
    case "not_saas":
      return "Promo codes are only available in SaaS mode";
    case "empty_code":
      return "Promo code is required";
    case "not_found":
      return "Promo code not found";
    case "inactive":
      return "Promo code is not active";
    case "expired":
      return "Promo code has expired";
    case "already_redeemed":
      return "You have already used this promo code";
  }
}
