import type { H3Event } from "h3";
import { getCookie, setCookie } from "h3";
import { normalizePromoCode } from "../core/billing/promo-discount";

export const PROMO_COOKIE_NAME = "tg_promo_code";

/** Sticky until replaced by another apply — long max-age, no explicit remove control. */
const PROMO_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export function setPromoCookie(event: H3Event, code: string): void {
  setCookie(event, PROMO_COOKIE_NAME, normalizePromoCode(code), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PROMO_COOKIE_MAX_AGE,
  });
}

export function readPromoCookie(event: H3Event): string | undefined {
  const raw = getCookie(event, PROMO_COOKIE_NAME);
  if (!raw?.trim()) {
    return undefined;
  }
  return normalizePromoCode(raw);
}
