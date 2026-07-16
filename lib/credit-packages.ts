export type CreditPackageId = "start" | "growth" | "max";

export type CreditPackage = {
  id: CreditPackageId;
  credits: number;
  amountRub: number;
  labelKey: string;
};

export const CREDIT_PACKAGES: Record<CreditPackageId, CreditPackage> = {
  start: {
    id: "start",
    credits: 10_000,
    amountRub: 490,
    labelKey: "billing.packages.start",
  },
  growth: {
    id: "growth",
    credits: 50_000,
    amountRub: 1_990,
    labelKey: "billing.packages.growth",
  },
  max: {
    id: "max",
    credits: 100_000,
    amountRub: 3_990,
    labelKey: "billing.packages.max",
  },
};

export const SIGNUP_CREDIT_GRANT = 100;

export function resolveCreditPackage(
  packageId: string
): CreditPackage | null {
  if (packageId in CREDIT_PACKAGES) {
    return CREDIT_PACKAGES[packageId as CreditPackageId];
  }
  return null;
}
