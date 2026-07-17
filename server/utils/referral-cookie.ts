import type { H3Event } from "h3";
import { getCookie, setCookie } from "h3";
import { REFERRAL_COOKIE_DAYS } from "../../lib/referral-config";

export const REFERRAL_COOKIE_NAME = "tg_referral_code";

const REFERRAL_COOKIE_MAX_AGE = REFERRAL_COOKIE_DAYS * 24 * 60 * 60;

export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Last-click attribution — each apply overwrites the previous cookie. */
export function setReferralCookie(event: H3Event, code: string): void {
  setCookie(event, REFERRAL_COOKIE_NAME, normalizeReferralCode(code), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFERRAL_COOKIE_MAX_AGE,
  });
}

export function readReferralCookie(event: H3Event): string | undefined {
  const raw = getCookie(event, REFERRAL_COOKIE_NAME);
  if (!raw?.trim()) {
    return undefined;
  }
  return normalizeReferralCode(raw);
}
