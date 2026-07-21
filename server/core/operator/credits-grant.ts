import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { randomUUID } from "node:crypto";
import { BotRepository } from "../../database/repositories/bot-repository";
import type { CreditTransaction } from "../../database/models/credit-transaction";
import type { CreditService } from "../credit-service";

export type CreditsGrantInput = {
  bot_id: string;
  amount: number;
  reason: string;
  actor_user_id?: string;
  reference?: string;
  operator_note?: string;
};

export type CreditsGrantCliError =
  | "not_saas"
  | "missing_bot_id"
  | "missing_reason"
  | "invalid_amount"
  | "bot_not_found"
  | "insufficient_balance";

export type CreditsGrantCliResult =
  | {
      ok: true;
      transaction: CreditTransaction;
      created: boolean;
      dry_run?: boolean;
    }
  | { ok: false; error: CreditsGrantCliError; message?: string };

export function parseGrantAmount(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") {
    return null;
  }
  const amount = Number(raw);
  if (!Number.isInteger(amount) || amount === 0) {
    return null;
  }
  return amount;
}

export function validateGrantReason(reason: string | undefined): string | null {
  const trimmed = reason?.trim();
  return trimmed ? trimmed : null;
}

export async function promptInteractiveCreditsGrant(): Promise<CreditsGrantInput> {
  const rl = createInterface({ input, output });
  try {
    const bot_id = (await rl.question("Bot id: ")).trim();
    if (!bot_id) {
      throw new Error("Bot id is required");
    }

    const amountRaw = await rl.question("Amount (signed integer, + grant / − deduct): ");
    const amount = parseGrantAmount(amountRaw);
    if (amount === null) {
      throw new Error("Amount must be a non-zero integer");
    }

    const reason = validateGrantReason(await rl.question("Reason: "));
    if (!reason) {
      throw new Error("Reason is required");
    }

    const operator_note = (await rl.question("Operator note (optional): ")).trim();

    const confirmLabel =
      amount < 0
        ? `Deduct ${Math.abs(amount)} credits from ${bot_id}? [y/N] `
        : `Grant ${amount} credits to ${bot_id}? [y/N] `;
    const confirm = (await rl.question(confirmLabel)).trim().toLowerCase();
    if (confirm !== "y" && confirm !== "yes") {
      throw new Error("Aborted");
    }

    return {
      bot_id,
      amount,
      reason,
      ...(operator_note ? { operator_note } : {}),
    };
  } finally {
    rl.close();
  }
}

export async function runCreditsGrantOperator(
  input: CreditsGrantInput,
  service: CreditService,
  options: { dryRun?: boolean } = {}
): Promise<CreditsGrantCliResult> {
  const botId = input.bot_id?.trim();
  if (!botId) {
    return { ok: false, error: "missing_bot_id" };
  }

  const reason = validateGrantReason(input.reason);
  if (!reason) {
    return { ok: false, error: "missing_reason" };
  }

  if (!Number.isInteger(input.amount) || input.amount === 0) {
    return { ok: false, error: "invalid_amount" };
  }

  if (!service.isBillingEnabled()) {
    return { ok: false, error: "not_saas" };
  }

  const botRepo = new BotRepository();
  const bot = await botRepo.findById(botId);
  if (!bot) {
    return { ok: false, error: "bot_not_found" };
  }

  const balance = await service.getBalance(botId);
  const balanceAfter = balance + input.amount;
  if (balanceAfter < 0) {
    return { ok: false, error: "insufficient_balance" };
  }

  const reference = input.reference?.trim() || `admin-grant:${randomUUID()}`;

  if (options.dryRun) {
    return {
      ok: true,
      created: false,
      dry_run: true,
      transaction: {
        id: 0,
        bot_id: botId,
        type: "admin_adjust",
        amount: input.amount,
        balance_after: balanceAfter,
        chat_id: null,
        reference,
        actor_user_id: input.actor_user_id ?? null,
        metadata: {
          reason,
          source: "cli",
          ...(input.operator_note?.trim()
            ? { operator_note: input.operator_note.trim() }
            : {}),
        },
        created_at: new Date(),
      },
    };
  }

  const result = await service.grantAdminAdjust({
    botId,
    amount: input.amount,
    reason,
    actorUserId: input.actor_user_id,
    reference: input.reference,
    operatorNote: input.operator_note,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return {
    ok: true,
    transaction: result.transaction,
    created: result.created,
  };
}

export function formatCreditsGrantResult(result: CreditsGrantCliResult): string {
  if (!result.ok) {
    return result.message ?? CREDITS_GRANT_ERROR_MESSAGES[result.error];
  }

  if (result.dry_run) {
    const tx = result.transaction;
    return [
      "Dry run — no changes written.",
      `  bot_id: ${tx.bot_id}`,
      `  amount: ${tx.amount}`,
      `  balance_after: ${tx.balance_after}`,
      `  reference: ${tx.reference}`,
    ].join("\n");
  }

  const tx = result.transaction;
  const lines = [
    result.created
      ? "Credits adjusted:"
      : "Idempotent replay (existing ledger row):",
    `  id: ${tx.id}`,
    `  bot_id: ${tx.bot_id}`,
    `  amount: ${tx.amount}`,
    `  balance_after: ${tx.balance_after}`,
    `  reference: ${tx.reference}`,
    `  type: ${tx.type}`,
  ];
  return lines.join("\n");
}

export const CREDITS_GRANT_ERROR_MESSAGES: Record<CreditsGrantCliError, string> =
  {
    not_saas: "Credit grants are only available when DEPLOYMENT_MODE=saas",
    missing_bot_id: "bot_id is required (--bot-id)",
    missing_reason: "reason is required (--reason)",
    invalid_amount: "amount must be a non-zero integer (--amount)",
    bot_not_found: "Bot not found",
    insufficient_balance: "Deduction would make credit balance negative",
  };
