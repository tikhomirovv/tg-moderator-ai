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

  return program;
}

export async function runCli(argv: string[]): Promise<void> {
  const program = buildCliProgram();
  await program.parseAsync(argv);
}
