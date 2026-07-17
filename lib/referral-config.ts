export const REFERRAL_COOKIE_DAYS = 30;

/** Percent of purchased package credits granted to the referee on first purchase. */
export const REFERRAL_REFEREE_PERCENT = 10;

/** Percent of purchased package credits granted to the referrer (pending until claim). */
export const REFERRAL_REFERRER_PERCENT = 10;

export function computeReferralBonusCredits(
  baseCredits: number,
  percent: number
): number {
  return Math.floor((baseCredits * percent) / 100);
}
