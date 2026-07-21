#!/usr/bin/env bun
import { Command } from "commander";
import {
  closeDatabase,
  getDatabaseConnection,
} from "../server/database/connection";
import {
  createPromoCodeOperator,
  formatPromoCreated,
  parseExpiresAt,
  promptInteractivePromoCreate,
  validateDiscountPercent,
} from "../server/core/operator/promo-create";
import { CreditService } from "../server/core/credit-service";
import {
  CREDITS_GRANT_ERROR_MESSAGES,
  formatCreditsGrantResult,
  parseGrantAmount,
  promptInteractiveCreditsGrant,
  runCreditsGrantOperator,
  validateGrantReason,
} from "../server/core/operator/credits-grant";

async function withDatabase<T>(fn: () => Promise<T>): Promise<T> {
  const connection = getDatabaseConnection();
  await connection.connect();
  try {
    return await fn();
  } finally {
    await closeDatabase();
  }
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

async function runPromoCreate(options: {
  code?: string;
  percent?: string;
  expires?: string;
}) {
  if (!process.env.DATABASE_URL) {
    exitWithError("DATABASE_URL is required");
  }

  let code: string;
  let discountPercent: number;
  let expiresAt: Date | null;

  if (options.code !== undefined || options.percent !== undefined) {
    if (!options.code || options.percent === undefined) {
      exitWithError("Non-interactive mode requires --code and --percent");
    }
    code = options.code;
    discountPercent = Number(options.percent);
    try {
      expiresAt = options.expires ? parseExpiresAt(options.expires) : null;
    } catch (error) {
      exitWithError(error instanceof Error ? error.message : String(error));
    }
  } else {
    try {
      const interactive = await promptInteractivePromoCreate();
      code = interactive.code;
      discountPercent = interactive.discount_percent;
      expiresAt = interactive.expires_at;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === "Aborted") {
        console.log("Aborted.");
        process.exit(0);
      }
      exitWithError(message);
    }
  }

  if (!validateDiscountPercent(discountPercent)) {
    exitWithError("Discount percent must be an integer from 1 to 100");
  }

  await withDatabase(async () => {
    const result = await createPromoCodeOperator({
      code,
      discount_percent: discountPercent,
      expires_at: expiresAt,
    });

    if (!result.ok) {
      if (result.error === "duplicate") {
        exitWithError(`Promo code already exists: ${code.trim().toUpperCase()}`);
      }
      exitWithError(`Failed to create promo: ${result.error}`);
    }

    console.log(formatPromoCreated(result.promo));
  });
}

async function runCreditsGrant(options: {
  botId?: string;
  amount?: string;
  reason?: string;
  actorUserId?: string;
  reference?: string;
  note?: string;
  dryRun?: boolean;
}) {
  if (!process.env.DATABASE_URL) {
    exitWithError("DATABASE_URL is required");
  }

  let grantInput: {
    bot_id: string;
    amount: number;
    reason: string;
    actor_user_id?: string;
    reference?: string;
    operator_note?: string;
  };

  const hasFlags =
    options.botId !== undefined ||
    options.amount !== undefined ||
    options.reason !== undefined;

  if (hasFlags) {
    if (!options.botId || options.amount === undefined || !options.reason) {
      exitWithError(
        "Non-interactive mode requires --bot-id, --amount, and --reason"
      );
    }
    const amount = parseGrantAmount(options.amount);
    if (amount === null) {
      exitWithError(CREDITS_GRANT_ERROR_MESSAGES.invalid_amount);
    }
    const reason = validateGrantReason(options.reason);
    if (!reason) {
      exitWithError(CREDITS_GRANT_ERROR_MESSAGES.missing_reason);
    }
    grantInput = {
      bot_id: options.botId.trim(),
      amount,
      reason,
      ...(options.actorUserId?.trim()
        ? { actor_user_id: options.actorUserId.trim() }
        : {}),
      ...(options.reference?.trim() ? { reference: options.reference.trim() } : {}),
      ...(options.note?.trim() ? { operator_note: options.note.trim() } : {}),
    };
  } else {
    try {
      grantInput = await promptInteractiveCreditsGrant();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === "Aborted") {
        console.log("Aborted.");
        process.exit(0);
      }
      exitWithError(message);
    }
  }

  await withDatabase(async () => {
    const service = new CreditService({ env: process.env });
    const result = await runCreditsGrantOperator(grantInput, service, {
      dryRun: Boolean(options.dryRun),
    });

    if (!result.ok) {
      exitWithError(
        result.message ?? CREDITS_GRANT_ERROR_MESSAGES[result.error]
      );
    }

    console.log(formatCreditsGrantResult(result));
  });
}

export function buildCliProgram(): Command {
  const program = new Command()
    .name("cli")
    .description("Operator CLI for Telemodai (SaaS maintenance)")
    .showHelpAfterError();

  const promo = program.command("promo").description("Promo code operations");

  promo
    .command("create")
    .description("Create a new purchase promo code")
    .option("--code <code>", "Promo code (uppercased)")
    .option("--percent <n>", "Discount percent (1-100)")
    .option("--expires <iso>", "Expiry (ISO 8601) or omit for no expiry")
    .action(async (options) => {
      await runPromoCreate(options);
    });

  const credits = program
    .command("credits")
    .description("Bot credit wallet operations");

  credits
    .command("grant")
    .description("Grant or deduct bot credits (admin_adjust ledger)")
    .option("--bot-id <id>", "Target bot id")
    .option("--amount <n>", "Signed integer (+ grant, − deduct)")
    .option("--reason <text>", "Required reason (stored in ledger metadata)")
    .option("--actor-user-id <userId>", "Optional actor user id")
    .option("--reference <ref>", "Idempotency key; replays return existing row")
    .option("--note <text>", "Optional operator note in metadata")
    .option("--dry-run", "Validate and preview without writing", false)
    .action(async (options) => {
      await runCreditsGrant(options);
    });

  return program;
}

export async function runCli(argv: string[]): Promise<void> {
  const program = buildCliProgram();
  await program.parseAsync(argv);
}
