import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  BillingProvider,
  BillingWebhookEvent,
} from "../billing-provider";
import { resolveCreditPackage } from "../credit-packages";
import { logger } from "../logger";

const YOOKASSA_API = "https://api.yookassa.ru/v3";

type YooKassaPaymentResponse = {
  id: string;
  status: string;
  confirmation?: { confirmation_url?: string };
};

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

export class YooKassaBillingProvider implements BillingProvider {
  constructor(private env: NodeJS.ProcessEnv = process.env) {}

  async createCheckout(input: {
    botId: string;
    purchaserUserId: string;
    packageId: string;
    returnUrl: string;
  }): Promise<{ checkoutUrl: string; providerPaymentId: string }> {
    const pkg = resolveCreditPackage(input.packageId);
    if (!pkg) {
      throw new Error(`Unknown credit package: ${input.packageId}`);
    }

    const { shopId, secretKey } = resolveYooKassaCredentials(this.env);
    const idempotenceKey = `${input.botId}:${input.packageId}:${Date.now()}`;

    const body = {
      amount: {
        value: pkg.amountRub.toFixed(2),
        currency: "RUB",
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: input.returnUrl,
      },
      description: `Credits package ${pkg.id} for bot ${input.botId}`,
      metadata: {
        bot_id: input.botId,
        purchaser_user_id: input.purchaserUserId,
        package_id: pkg.id,
        credits: String(pkg.credits),
      },
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

    const metadata = body.object.metadata ?? {};
    const botId = metadata.bot_id;
    const purchaserUserId = metadata.purchaser_user_id;
    const packageId = metadata.package_id;
    const creditsRaw = metadata.credits;

    if (!botId || !purchaserUserId || !packageId) {
      logger.warn({ metadata }, "YooKassa webhook missing metadata");
      return null;
    }

    const pkg = resolveCreditPackage(packageId);
    const credits = creditsRaw ? Number(creditsRaw) : pkg?.credits ?? 0;
    const amountRub = pkg?.amountRub ?? Number(body.object.amount?.value ?? 0);

    return {
      providerPaymentId: body.object.id,
      botId,
      purchaserUserId,
      packageId,
      credits,
      amountRub,
      status: "paid",
    };
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
