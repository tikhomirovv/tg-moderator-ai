import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { PromoCodeRepository } from "../../database/repositories/promo-code-repository";
import type { PromoCode } from "../../database/models/promo-code";
import { normalizePromoCode } from "../billing/promo-discount";

export type PromoCreateInput = {
  code: string;
  discount_percent: number;
  expires_at: Date | null;
};

export type PromoCreateResult =
  | { ok: true; promo: PromoCode }
  | { ok: false; error: "duplicate" | "invalid_percent" | "invalid_expires" | "missing_code" };

export function parseExpiresAt(raw: string | undefined): Date | null {
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

export function validateDiscountPercent(discountPercent: number): boolean {
  return (
    Number.isInteger(discountPercent) &&
    discountPercent >= 1 &&
    discountPercent <= 100
  );
}

export async function promptInteractivePromoCreate(): Promise<PromoCreateInput> {
  const rl = createInterface({ input, output });
  try {
    const code = normalizePromoCode(await rl.question("Promo code: "));
    if (!code) {
      throw new Error("Code is required");
    }

    const percentRaw = await rl.question("Discount percent (1-100): ");
    const discountPercent = Number(percentRaw);
    if (!validateDiscountPercent(discountPercent)) {
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
      throw new Error("Aborted");
    }

    return { code, discount_percent: discountPercent, expires_at: expiresAt };
  } finally {
    rl.close();
  }
}

export async function createPromoCodeOperator(
  input: PromoCreateInput,
  repo = new PromoCodeRepository()
): Promise<PromoCreateResult> {
  const code = normalizePromoCode(input.code);
  if (!code) {
    return { ok: false, error: "missing_code" };
  }
  if (!validateDiscountPercent(input.discount_percent)) {
    return { ok: false, error: "invalid_percent" };
  }

  const existing = await repo.findByCode(code);
  if (existing) {
    return { ok: false, error: "duplicate" };
  }

  const promo = await repo.create({
    code,
    discount_percent: input.discount_percent,
    expires_at: input.expires_at,
  });

  return { ok: true, promo };
}

export function formatPromoCreated(promo: PromoCode): string {
  const lines = [
    "Promo code created:",
    `  id: ${promo.id}`,
    `  code: ${promo.code}`,
    `  discount_percent: ${promo.discount_percent}`,
    `  expires_at: ${
      promo.expires_at ? new Date(promo.expires_at).toISOString() : "(none)"
    }`,
  ];
  return lines.join("\n");
}
