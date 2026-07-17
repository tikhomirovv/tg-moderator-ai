import { isSaasMode } from "./deployment-mode";
import { CreditService } from "./credit-service";
import {
  computeReferralBonusCredits,
  REFERRAL_REFEREE_PERCENT,
  REFERRAL_REFERRER_PERCENT,
} from "../../lib/referral-config";
import type { AppUser } from "../database/models/user";
import { ReferralRepository } from "../database/repositories/referral-repository";
import { UserRepository } from "../database/repositories/user-repository";
import { BotMemberRepository } from "../database/repositories/bot-member-repository";
import { normalizeReferralCode } from "../utils/referral-cookie";

export type ReferralProcessResult =
  | { status: "applied"; referral_id: number }
  | { status: "duplicate" }
  | { status: "skipped"; reason: string };

export type ReferralStore = {
  findUserByReferralCode(code: string): Promise<AppUser | null>;
  findUserById(id: string): Promise<AppUser | null>;
  findReferralByPaymentId(paymentId: string): Promise<{ id: number } | null>;
  findReferralByReferee(refereeUserId: string): Promise<{ id: number } | null>;
  countPriorPurchases(
    userId: string,
    excludePaymentId: string
  ): Promise<number>;
  createReferral(input: {
    referrer_user_id: string;
    referee_user_id: string;
    provider_payment_id: string;
    base_credits: number;
    referee_bonus_credits: number;
    referrer_bonus_credits: number;
    referee_bot_id: string;
    referrer_status: "pending" | "skipped_zero";
    referral_code?: string;
  }): Promise<{ id: number }>;
  listPendingReferrals(
    referrerUserId: string
  ): Promise<Array<{ id: number; referrer_bonus_credits: number }>>;
  markReferrerClaimed(referralIds: number[], botId: string): Promise<void>;
  getMemberRole(botId: string, userId: string): Promise<string | null>;
};

class DrizzleReferralStore implements ReferralStore {
  private users = new UserRepository();
  private referrals = new ReferralRepository();
  private members = new BotMemberRepository();

  findUserByReferralCode(code: string) {
    return this.users.findByReferralCode(code);
  }

  findUserById(id: string) {
    return this.users.findById(id);
  }

  async findReferralByPaymentId(paymentId: string) {
    const row = await this.referrals.findByProviderPaymentId(paymentId);
    return row ? { id: row.id } : null;
  }

  async findReferralByReferee(refereeUserId: string) {
    const row = await this.referrals.findByRefereeUserId(refereeUserId);
    return row ? { id: row.id } : null;
  }

  countPriorPurchases(userId: string, excludePaymentId: string) {
    return this.referrals.countPriorPurchasesForUser(userId, excludePaymentId);
  }

  async createReferral(input: {
    referrer_user_id: string;
    referee_user_id: string;
    provider_payment_id: string;
    base_credits: number;
    referee_bonus_credits: number;
    referrer_bonus_credits: number;
    referee_bot_id: string;
    referrer_status: "pending" | "skipped_zero";
    referral_code?: string;
  }) {
    const row = await this.referrals.create(input);
    return { id: row.id };
  }

  async listPendingReferrals(referrerUserId: string) {
    const rows = await this.referrals.listPendingByReferrerUserId(referrerUserId);
    return rows.map((row) => ({
      id: row.id,
      referrer_bonus_credits: row.referrer_bonus_credits,
    }));
  }

  markReferrerClaimed(referralIds: number[], botId: string) {
    return this.referrals.markReferrerClaimed(referralIds, botId);
  }

  async getMemberRole(botId: string, userId: string) {
    return this.members.getMemberRole(botId, userId);
  }
}

type ReferralServiceOptions = {
  env?: NodeJS.ProcessEnv;
  store?: ReferralStore;
  creditService?: CreditService;
};

export class ReferralService {
  private env: NodeJS.ProcessEnv;
  private store: ReferralStore;
  private creditService: CreditService;

  constructor(options: ReferralServiceOptions = {}) {
    this.env = options.env ?? process.env;
    this.store = options.store ?? new DrizzleReferralStore();
    this.creditService =
      options.creditService ?? new CreditService({ env: this.env });
  }

  isEnabled(): boolean {
    return isSaasMode(this.env);
  }

  async processPaidPurchase(input: {
    providerPaymentId: string;
    refereeUserId: string;
    botId: string;
    baseCredits: number;
    referralCodeFromCheckout?: string | null;
  }): Promise<ReferralProcessResult> {
    if (!this.isEnabled()) {
      return { status: "skipped", reason: "not_saas" };
    }

    const code = input.referralCodeFromCheckout?.trim();
    if (!code) {
      return { status: "skipped", reason: "no_attribution" };
    }

    const existing = await this.store.findReferralByPaymentId(
      input.providerPaymentId
    );
    if (existing) {
      return { status: "duplicate" };
    }

    if (await this.store.findReferralByReferee(input.refereeUserId)) {
      return { status: "skipped", reason: "referee_already_referred" };
    }

    const priorPurchases = await this.store.countPriorPurchases(
      input.refereeUserId,
      input.providerPaymentId
    );
    if (priorPurchases > 0) {
      return { status: "skipped", reason: "not_first_purchase" };
    }

    const referrer = await this.store.findUserByReferralCode(
      normalizeReferralCode(code)
    );
    if (!referrer) {
      return { status: "skipped", reason: "invalid_code" };
    }

    if (referrer.id === input.refereeUserId) {
      return { status: "skipped", reason: "self_referral" };
    }

    const referee = await this.store.findUserById(input.refereeUserId);
    if (!referee) {
      return { status: "skipped", reason: "referee_not_found" };
    }

    if (referrer.created_at >= referee.created_at) {
      return { status: "skipped", reason: "referrer_not_older" };
    }

    const refereeBonus = computeReferralBonusCredits(
      input.baseCredits,
      REFERRAL_REFEREE_PERCENT
    );
    const referrerBonus = computeReferralBonusCredits(
      input.baseCredits,
      REFERRAL_REFERRER_PERCENT
    );

    const referrerStatus =
      referrerBonus > 0 ? ("pending" as const) : ("skipped_zero" as const);

    const referral = await this.store.createReferral({
      referrer_user_id: referrer.id,
      referee_user_id: input.refereeUserId,
      provider_payment_id: input.providerPaymentId,
      base_credits: input.baseCredits,
      referee_bonus_credits: refereeBonus,
      referrer_bonus_credits: referrerBonus,
      referee_bot_id: input.botId,
      referrer_status: referrerStatus,
      referral_code: normalizeReferralCode(code),
    });

    if (refereeBonus > 0) {
      await this.creditService.grantReferralBonus({
        botId: input.botId,
        credits: refereeBonus,
        actorUserId: input.refereeUserId,
        referralId: referral.id,
        role: "referee",
        baseCredits: input.baseCredits,
        percent: REFERRAL_REFEREE_PERCENT,
        providerPaymentId: input.providerPaymentId,
      });
    }

    return { status: "applied", referral_id: referral.id };
  }

  async getPendingSummary(userId: string): Promise<{
    credits: number;
    count: number;
  }> {
    if (!this.isEnabled()) {
      return { credits: 0, count: 0 };
    }

    const pending = await this.store.listPendingReferrals(userId);
    const credits = pending.reduce(
      (sum, row) => sum + row.referrer_bonus_credits,
      0
    );
    return { credits, count: pending.length };
  }

  async claimPending(
    userId: string,
    botId: string
  ): Promise<{ credits: number; referral_ids: number[] }> {
    if (!this.isEnabled()) {
      throw createError({
        statusCode: 404,
        statusMessage: "Referral rewards are only available in SaaS mode",
      });
    }

    const role = await this.store.getMemberRole(botId, userId);
    if (role !== "owner") {
      throw createError({
        statusCode: 403,
        statusMessage: "Only bot owners can claim referral credits",
      });
    }

    const pending = await this.store.listPendingReferrals(userId);
    if (pending.length === 0) {
      return { credits: 0, referral_ids: [] };
    }

    const totalCredits = pending.reduce(
      (sum, row) => sum + row.referrer_bonus_credits,
      0
    );
    const referralIds = pending.map((row) => row.id);

    if (totalCredits > 0) {
      await this.creditService.grantReferralBonus({
        botId,
        credits: totalCredits,
        actorUserId: userId,
        referralId: referralIds[0]!,
        role: "referrer",
        baseCredits: totalCredits,
        percent: REFERRAL_REFERRER_PERCENT,
        providerPaymentId: `claim:${referralIds.join(",")}`,
        reference: `referral-claim:${userId}:${referralIds.join(",")}`,
        metadata: { referral_ids: referralIds, claim_batch: true },
      });
    }

    await this.store.markReferrerClaimed(referralIds, botId);

    return { credits: totalCredits, referral_ids: referralIds };
  }
}
