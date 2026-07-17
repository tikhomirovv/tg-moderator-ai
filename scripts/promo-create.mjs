import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import postgres from "postgres";

function parseArgs(argv) {
  const flags = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--code") {
      flags.code = argv[++i];
    } else if (arg === "--percent") {
      flags.percent = Number(argv[++i]);
    } else if (arg === "--expires") {
      flags.expires = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      flags.help = true;
    }
  }
  return flags;
}

function printHelp() {
  console.log(`Usage:
  node scripts/promo-create.mjs
  node scripts/promo-create.mjs --code SAVE10 --percent 10 [--expires 2026-12-31T23:59:59Z]

Interactive mode prompts for code, discount percent, and optional expiry (ISO or empty).
Requires DATABASE_URL in environment.`);
}

function normalizeCode(code) {
  return code.trim().toUpperCase();
}

function parseExpiresAt(raw) {
  const value = raw?.trim();
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid expires_at: ${value}`);
  }
  return date;
}

async function promptInteractive() {
  const rl = createInterface({ input, output });
  try {
    const code = normalizeCode(await rl.question("Promo code: "));
    if (!code) {
      throw new Error("Code is required");
    }

    const percentRaw = await rl.question("Discount percent (1-100): ");
    const discountPercent = Number(percentRaw);
    if (
      !Number.isInteger(discountPercent) ||
      discountPercent < 1 ||
      discountPercent > 100
    ) {
      throw new Error("Discount percent must be an integer from 1 to 100");
    }

    const expiresRaw = await rl.question(
      "Expires at (ISO 8601, empty = never): "
    );
    const expiresAt = parseExpiresAt(expiresRaw);

    const confirm = (
      await rl.question(
        `Create ${code} with ${discountPercent}% discount${
          expiresAt ? ` until ${expiresAt.toISOString()}` : ""
        }? [y/N] `
      )
    )
      .trim()
      .toLowerCase();

    if (confirm !== "y" && confirm !== "yes") {
      console.log("Aborted.");
      process.exit(0);
    }

    return { code, discountPercent, expiresAt };
  } finally {
    rl.close();
  }
}

async function main() {
  const flags = parseArgs(process.argv);
  if (flags.help) {
    printHelp();
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  let code;
  let discountPercent;
  let expiresAt;

  if (flags.code || flags.percent !== undefined) {
    if (!flags.code || flags.percent === undefined) {
      console.error("Non-interactive mode requires --code and --percent");
      process.exit(1);
    }
    code = normalizeCode(flags.code);
    discountPercent = flags.percent;
    expiresAt = flags.expires ? parseExpiresAt(flags.expires) : null;
  } else {
    ({ code, discountPercent, expiresAt } = await promptInteractive());
  }

  if (
    !Number.isInteger(discountPercent) ||
    discountPercent < 1 ||
    discountPercent > 100
  ) {
    console.error("Discount percent must be an integer from 1 to 100");
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1, onnotice: () => {} });

  try {
    const rows = await sql`
      INSERT INTO promo_codes (code, discount_percent, is_active, expires_at, created_at, updated_at)
      VALUES (
        ${code},
        ${discountPercent},
        true,
        ${expiresAt},
        now(),
        now()
      )
      ON CONFLICT (code) DO NOTHING
      RETURNING id, code, discount_percent, expires_at
    `;

    if (rows.length === 0) {
      console.error(`Promo code already exists: ${code}`);
      process.exit(1);
    }

    const created = rows[0];
    console.log("Promo code created:");
    console.log(`  id: ${created.id}`);
    console.log(`  code: ${created.code}`);
    console.log(`  discount_percent: ${created.discount_percent}`);
    console.log(
      `  expires_at: ${created.expires_at ? new Date(created.expires_at).toISOString() : "(none)"}`
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
