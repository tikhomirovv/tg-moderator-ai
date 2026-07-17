import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  BillingProvider,
  BillingWebhookEvent,
} from "../billing-provider";
import { resolveCreditPackage } from "../credit-packages";
import { logger } from "../logger";

const YOOKASSA_API = "https://api.yookassa.ru/v3";

type YooKassaPaymentObject = {
  id?: string;
  status?: string;
  amount?: { value?: string; currency?: string };
  metadata?: Record<string, string>;
  confirmation?: { confirmation_url?: string };
};

type YooKassaPaymentResponse = YooKassaPaymentObject;

type YooKassaWebhookPayload = {
  event?: string;
  object?: {
    id?: string;
    status?: string;
    amount?: { value?: string; currency?: string };
    metadata?: Record<string, string>;
  };
};

function resolveYooKassaCredentials(env: NodeJS.ProcessEnv = process.env) {
  const shopId = env.YOOKASSA_SHOP_ID?.trim();
  const secretKey = env.YOOKASSA_SECRET_KEY?.trim();
  if (!shopId || !secretKey) {
    throw new Error("YooKassa credentials are not configured");
  }
  return { shopId, secretKey };
}

function basicAuthHeader(shopId: string, secretKey: string): string {
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

function mapYooKassaStatusToBillingStatus(
  status: string | undefined
): BillingWebhookEvent["status"] {
  if (status === "succeeded") {
    return "paid";
  }
  if (status === "refunded") {
    return "refunded";
  }
  if (status === "canceled") {
    return "failed";
  }
  if (status === "pending" || status === "waiting_for_capture") {
    return "pending";
  }
  return "failed";
}

function parseYooKassaPaymentObject(
  object: YooKassaPaymentObject
): BillingWebhookEvent | null {
  if (!object.id) {
    return null;
  }

  const metadata = object.metadata ?? {};
  const botId = metadata.bot_id;
  const purchaserUserId = metadata.purchaser_user_id;
  const packageId = metadata.package_id;
  const creditsRaw = metadata.credits;

  if (!botId || !purchaserUserId || !packageId) {
    logger.warn({ metadata, paymentId: object.id }, "YooKassa payment missing metadata");
    return null;
  }

  const pkg = resolveCreditPackage(packageId);
  const credits = creditsRaw ? Number(creditsRaw) : pkg?.credits ?? 0;
  const paidFromProvider = Number(object.amount?.value ?? 0);
  const amountRub =
    paidFromProvider > 0 ? paidFromProvider : (pkg?.amountRub ?? 0);
  const billingStatus = mapYooKassaStatusToBillingStatus(object.status);

  return {
    providerPaymentId: object.id,
    botId,
    purchaserUserId,
    packageId,
    credits,
    amountRub,
    status: billingStatus,
  };
}

export class YooKassaBillingProvider implements BillingProvider {
  constructor(private env: NodeJS.ProcessEnv = process.env) {}

  async createCheckout(input: {
    botId: string;
    purchaserUserId: string;
    packageId: string;
    returnUrl: string;
    amountRub?: number;
    promoCode?: string;
  }): Promise<{ checkoutUrl: string; providerPaymentId: string }> {
    const pkg = resolveCreditPackage(input.packageId);
    if (!pkg) {
      throw new Error(`Unknown credit package: ${input.packageId}`);
    }

    const chargeAmountRub = input.amountRub ?? pkg.amountRub;
    const { shopId, secretKey } = resolveYooKassaCredentials(this.env);
    const idempotenceKey = `${input.botId}:${input.packageId}:${Date.now()}`;

    const metadata: Record<string, string> = {
      bot_id: input.botId,
      purchaser_user_id: input.purchaserUserId,
      package_id: pkg.id,
      credits: String(pkg.credits),
    };
    if (input.promoCode) {
      metadata.promo_code = input.promoCode;
    }

    const body = {
      amount: {
        value: chargeAmountRub.toFixed(2),
        currency: "RUB",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: input.returnUrl,
      },
      description: `Credits package ${pkg.id} for bot ${input.botId}`,
      metadata,
    };

    const response = await fetch(`${YOOKASSA_API}/payments`, {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(shopId, secretKey),
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status, text }, "YooKassa create payment failed");
      throw new Error("Failed to create YooKassa payment");
    }

    const payment = (await response.json()) as YooKassaPaymentResponse;
    const checkoutUrl = payment.confirmation?.confirmation_url;
    if (!checkoutUrl || !payment.id) {
      throw new Error("YooKassa payment response missing confirmation URL");
    }

    return { checkoutUrl, providerPaymentId: payment.id };
  }

  async verifyWebhook(
    payload: unknown,
    headers: Headers
  ): Promise<BillingWebhookEvent | null> {
    const body = payload as YooKassaWebhookPayload;
    if (body.event !== "payment.succeeded" || !body.object?.id) {
      return null;
    }

    if (!this.verifyWebhookSignature(payload, headers)) {
      throw new Error("Invalid YooKassa webhook signature");
    }

    const parsed = parseYooKassaPaymentObject(body.object);
    if (!parsed) {
      return null;
    }

    return { ...parsed, status: "paid" };
  }

  async fetchPayment(
    providerPaymentId: string
  ): Promise<BillingWebhookEvent | null> {
    const { shopId, secretKey } = resolveYooKassaCredentials(this.env);
    const response = await fetch(
      `${YOOKASSA_API}/payments/${encodeURIComponent(providerPaymentId)}`,
      {
        headers: {
          Authorization: basicAuthHeader(shopId, secretKey),
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const text = await response.text();
      logger.error(
        { status: response.status, text, paymentId: providerPaymentId },
        "YooKassa fetch payment failed"
      );
      throw new Error("Failed to fetch YooKassa payment");
    }

    const payment = (await response.json()) as YooKassaPaymentObject;
    return parseYooKassaPaymentObject(payment);
  }

  private verifyWebhookSignature(payload: unknown, headers: Headers): boolean {
    const { secretKey } = resolveYooKassaCredentials(this.env);
    const signature = headers.get("x-yookassa-signature");
    if (!signature) {
      // Test shop may omit signature header — allow when explicitly disabled.
      if (this.env.YOOKASSA_SKIP_SIGNATURE_VERIFY === "true") {
        return true;
      }
      return false;
    }

    const body = JSON.stringify(payload);
    const digest = createHmac("sha256", secretKey).update(body).digest("hex");
    try {
      return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}

export function createBillingProvider(
  env: NodeJS.ProcessEnv = process.env
): BillingProvider {
  return new YooKassaBillingProvider(env);
}
