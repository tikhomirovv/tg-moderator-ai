export type ProviderPaymentStatus =
  | "pending"
  | "succeeded"
  | "canceled"
  | "credited";

export interface ProviderPayment {
  id: number;
  provider_payment_id: string;
  bot_id: string;
  package_id: string;
  amount_rub: number;
  credits: number;
  status: ProviderPaymentStatus;
  purchaser_user_id: string;
  credited_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProviderPaymentInput {
  provider_payment_id: string;
  bot_id: string;
  package_id: string;
  amount_rub: number;
  credits: number;
  purchaser_user_id: string;
}
