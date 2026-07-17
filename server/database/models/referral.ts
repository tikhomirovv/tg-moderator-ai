export type ReferrerStatus = "pending" | "claimed" | "skipped_zero";

export interface Referral {
  id: number;
  referrer_user_id: string;
  referee_user_id: string;
  provider_payment_id: string;
  base_credits: number;
  referee_bonus_credits: number;
  referrer_bonus_credits: number;
  referee_bot_id?: string | null;
  referrer_status: ReferrerStatus;
  referrer_claimed_bot_id?: string | null;
  referral_code?: string | null;
  created_at: Date;
  claimed_at?: Date | null;
}
