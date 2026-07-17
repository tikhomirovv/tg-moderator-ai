import { describe, expect, test } from "bun:test";
import {
  computeReferralBonusCredits,
  REFERRAL_REFEREE_PERCENT,
} from "../../../lib/referral-config";

describe("referral-config", () => {
  test("computeReferralBonusCredits floors percent of package credits", () => {
    expect(computeReferralBonusCredits(10_000, 10)).toBe(1000);
    expect(computeReferralBonusCredits(99, 10)).toBe(9);
    expect(computeReferralBonusCredits(5, REFERRAL_REFEREE_PERCENT)).toBe(0);
  });
});
