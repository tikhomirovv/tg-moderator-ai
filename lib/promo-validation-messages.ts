/** Stable API statusMessage strings for promo validation (used by server + client i18n mapping). */
export const PROMO_VALIDATION_STATUS_MESSAGES = {
  not_saas: "Promo codes are only available in SaaS mode",
  empty_code: "Promo code is required",
  not_found: "Promo code not found",
  inactive: "Promo code is not active",
  expired: "Promo code has expired",
  already_redeemed: "You have already used this promo code",
} as const;

export type PromoValidationStatusKey = keyof typeof PROMO_VALIDATION_STATUS_MESSAGES;

const STATUS_MESSAGE_TO_I18N_KEY: Record<string, string> = {
  [PROMO_VALIDATION_STATUS_MESSAGES.not_saas]: "billing.promo.errors.notSaas",
  [PROMO_VALIDATION_STATUS_MESSAGES.empty_code]: "billing.promo.errors.required",
  [PROMO_VALIDATION_STATUS_MESSAGES.not_found]: "billing.promo.errors.notFound",
  [PROMO_VALIDATION_STATUS_MESSAGES.inactive]: "billing.promo.errors.inactive",
  [PROMO_VALIDATION_STATUS_MESSAGES.expired]: "billing.promo.errors.expired",
  [PROMO_VALIDATION_STATUS_MESSAGES.already_redeemed]:
    "billing.promo.errors.alreadyRedeemed",
};

/** Map API statusMessage (English) to billing.promo.errors.* i18n key, if known. */
export function promoStatusMessageToI18nKey(statusMessage: string): string | null {
  return STATUS_MESSAGE_TO_I18N_KEY[statusMessage] ?? null;
}
