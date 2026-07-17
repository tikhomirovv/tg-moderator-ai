export interface PromoCode {
  id: number;
  code: string;
  discount_percent: number;
  is_active: boolean;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PromoRedemption {
  id: number;
  promo_code_id: number;
  user_id: string;
  provider_payment_id: string;
  created_at: Date;
}
