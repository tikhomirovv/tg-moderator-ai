import type { ComposerTranslation } from "vue-i18n";
import { readFetchError } from "./fetch-error";
import { promoStatusMessageToI18nKey } from "./promo-validation-messages";

export function resolvePromoUserMessage(
  statusMessage: string | undefined,
  t: ComposerTranslation,
  fallbackKey = "billing.promo.errors.generic"
): string {
  if (!statusMessage) {
    return t(fallbackKey);
  }

  const i18nKey = promoStatusMessageToI18nKey(statusMessage);
  if (i18nKey) {
    return t(i18nKey);
  }

  return statusMessage;
}

export function resolvePromoApplyFetchError(
  error: unknown,
  t: ComposerTranslation
): string {
  const statusMessage = readFetchError(error, "");
  return resolvePromoUserMessage(statusMessage || undefined, t);
}
